import json
import time
import logging
import re
from typing import Dict, Any, List
from django.conf import settings
from .models import AIProcessingLog

# Try to import local utils, handle potential import errors gracefully
try:
    from utils.posthog_ai import posthog
    from posthog.ai.langchain import CallbackHandler
except ImportError:
    posthog = None

    class CallbackHandler:
        def __init__(self, client, privacy_mode=False):
            pass


logger = logging.getLogger(__name__)


class BaseAIService:
    """Base service for AI operations using simple prompts and JSON parsing."""

    PROVIDER_CONFIGS = {
        "openai": {
            "model_name": "gpt-4o-mini",
            "temperature": 0.3,
            "max_tokens": 4000,
        },
        "gemini": {
            "model_name": "gemini-2.0-flash",
            "temperature": 0.3,
            "max_tokens": 4000,
        },
    }

    GEMINI_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
    ]

    DEFAULT_PROVIDER = "openai"

    def __init__(self):
        self.provider = getattr(settings, "AI_PROVIDER", self.DEFAULT_PROVIDER)

        if self.provider not in self.PROVIDER_CONFIGS:
            raise ValueError(
                f"Unsupported provider: {self.provider}. Supported providers: {list(self.PROVIDER_CONFIGS.keys())}"
            )

        self.config = self.PROVIDER_CONFIGS[self.provider]

        self.callback_handler = CallbackHandler(client=posthog, privacy_mode=False)

        self._init_llm()

    def _init_llm(self, model_name=None):
        """Initialize the base LLM."""
        try:
            current_model = model_name or self.config["model_name"]

            if self.provider == "openai":
                from langchain_openai import ChatOpenAI

                self.llm = ChatOpenAI(
                    model=current_model,
                    temperature=self.config["temperature"],
                    max_tokens=self.config["max_tokens"],
                    openai_api_key=getattr(settings, "OPENAI_API_KEY", None),
                )
            elif self.provider == "gemini":
                from langchain_google_genai import ChatGoogleGenerativeAI

                self.llm = ChatGoogleGenerativeAI(
                    model=current_model,
                    temperature=self.config["temperature"],
                    max_tokens=self.config["max_tokens"],
                    google_api_key=getattr(settings, "GEMINI_API_KEY", None),
                )
        except ImportError:
            msg = "Missing required packages. "
            if self.provider == "openai":
                msg += "Install langchain-openai."
            else:
                msg += "Install langchain-google-genai google-generativeai."
            raise ImportError(msg)
        except Exception as e:
            logger.error(
                f"Failed to initialize LangChain for provider {self.provider}: {str(e)}"
            )
            raise

    def invoke_with_fallback(self, prompt, config=None):
        """Invoke LLM with fallback to other models if using Gemini."""
        if self.provider != "gemini":
            return self.llm.invoke(prompt, config=config)

        # For Gemini, try models in sequence
        errors = []

        # Ensure we start with the configured model, then try others
        models_to_try = []
        if self.config["model_name"] in self.GEMINI_MODELS:
            models_to_try.append(self.config["model_name"])
            models_to_try.extend(
                [m for m in self.GEMINI_MODELS if m != self.config["model_name"]]
            )
        else:
            models_to_try = self.GEMINI_MODELS

        for model in models_to_try:
            try:
                logger.info(f"Attempting invocation with Gemini model: {model}")
                self._init_llm(model_name=model)
                return self.llm.invoke(prompt, config=config)
            except Exception as e:
                error_str = str(e)
                logger.warning(f"Gemini model {model} failed: {error_str}")
                errors.append(f"{model}: {error_str}")

                # If it's not a rate limit or availability error, maybe we shouldn't retry?
                # But for now, let's assume we want to retry on most errors to be robust.
                continue

        # If all failed
        raise Exception(f"All Gemini models failed. Errors: {'; '.join(errors)}")

    def _parse_json_response(self, text: str) -> Any:
        """Parse JSON from LLM response, handling markdown code blocks."""
        try:
            # Remove markdown code blocks if present
            text = text.strip()

            # Pattern for ```json ... ``` or ``` ... ```
            if text.startswith("```"):
                match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
                if match:
                    text = match.group(1).strip()

            # Try to parse JSON
            return json.loads(text)

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {e}\nText: {text[:200]}")
            # Try to find JSON in the text
            json_match = re.search(r"\{.*\}|\[.*\]", text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise ValueError(f"Could not parse JSON from response: {text[:200]}")

    def _handle_rate_limit_error(self, error: Exception) -> None:
        """
        Handle rate limit errors by extracting retry delay and sleeping.
        This is a one-time backoff - no retry mechanism.

        Args:
            error: The exception that occurred

        Raises:
            Exception: Always raises the original error after delay
        """
        error_str = str(error)

        # Check if it's a rate limit error
        is_rate_limit = (
            "429" in error_str
            or "quota exceeded" in error_str.lower()
            or "rate limit" in error_str.lower()
            or "too many requests" in error_str.lower()
        )

        if not is_rate_limit:
            return

        # Extract retry delay from error message
        # Look for "Please retry in X.XXs" or "retry_delay { seconds: X }"
        retry_delay = None

        # Pattern 1: "Please retry in 9.209666008s"
        retry_match = re.search(r"retry in ([\d.]+)s?", error_str, re.IGNORECASE)
        if retry_match:
            retry_delay = float(retry_match.group(1))
        else:
            # Pattern 2: "retry_delay { seconds: 9 }" or "seconds: 9"
            retry_match = re.search(
                r"(?:retry[_\s]*delay|seconds)[^\d]*(\d+\.?\d*)",
                error_str,
                re.IGNORECASE,
            )
            if retry_match:
                retry_delay = float(retry_match.group(1))

        if retry_delay:
            # Add small buffer to be safe
            delay = retry_delay + 1.0
            logger.warning(
                f"Rate limit error detected. Waiting {delay:.2f} seconds before failing gracefully. "
                f"Error: {error_str[:200]}"
            )
            time.sleep(delay)
            logger.info(f"Rate limit backoff completed. Raising error.")
        else:
            # Default delay if we can't extract it
            logger.warning(
                f"Rate limit error detected but couldn't extract delay. Using default 10s backoff. "
                f"Error: {error_str[:200]}"
            )
            time.sleep(10.0)


class ScheduleParsingService(BaseAIService):
    """Service for parsing schedule text using AI with simple prompts."""

    def parse_schedule(
        self,
        raw_text: str,
        organization,
        user=None,
        event_title=None,
        event_start_date=None,
        event_end_date=None,
    ) -> Dict[str, Any]:
        start_time = time.time()

        prompt = f"""You are an expert at parsing event schedules from raw text. Extract schedule items and return them as JSON.

Guidelines:
1. Extract all schedule items with dates, times, titles, and descriptions
2. Parse dates (MM/DD/YYYY, DD/MM/YYYY, "Monday", etc.) to YYYY-MM-DD format
3. Parse times to HH:MM format (24-hour)
4. Use today's date if not specified
5. Estimate duration if end time is missing
6. Handle Polish time expressions (od/do means from/to)
7. Always return at least one item if time info exists

Event Information:
- Title: {event_title or 'N/A'}
- Date Range: {event_start_date or 'N/A'} to {event_end_date or 'N/A'}

Raw Schedule Text:
{raw_text}

Return ONLY a JSON array with this exact structure:
[
  {{
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "title": "Session title",
    "description": "Optional description"
  }}
]

JSON OUTPUT:"""

        log = AIProcessingLog.objects.create(
            provider_name=self.provider,
            input_text=raw_text,
            prompt_used=prompt,
            model_used=self.config["model_name"],
            status="processing",
            organization=organization,
            user=user,
            raw_llm_request={
                "provider": self.provider,
                "model": self.config["model_name"],
                "temperature": self.config["temperature"],
                "max_tokens": self.config["max_tokens"],
                "prompt": prompt,
                "event_title": event_title,
                "event_start_date": event_start_date,
                "event_end_date": event_end_date,
            },
        )

        try:
            # Invoke LLM
            try:
                response = self.invoke_with_fallback(
                    prompt, config={"callbacks": [self.callback_handler]}
                )
            except Exception as llm_error:
                # Handle rate limit errors with backoff
                self._handle_rate_limit_error(llm_error)
                # Re-raise after backoff
                raise

            response_text = (
                response.content if hasattr(response, "content") else str(response)
            )

            # Store raw LLM response
            raw_response_data = {
                "content": response_text,
                "type": str(type(response)),
                "response_metadata": getattr(response, "response_metadata", None),
                "usage_metadata": getattr(response, "usage_metadata", None),
            }

            logger.info(f"Schedule parsing raw response: {response_text[:200]}...")

            # Parse JSON
            debug_info = {"parsing_attempts": []}

            try:
                parsed_json = self._parse_json_response(response_text)
                debug_info["parsing_attempts"].append(
                    {
                        "success": True,
                        "method": "standard",
                        "result_type": str(type(parsed_json)),
                    }
                )
            except Exception as parse_error:
                debug_info["parsing_attempts"].append(
                    {"success": False, "method": "standard", "error": str(parse_error)}
                )
                raise

            # Ensure it's a list
            if isinstance(parsed_json, dict):
                parsed_json = [parsed_json]
                debug_info["converted_dict_to_list"] = "true"

            if not isinstance(parsed_json, list):
                raise ValueError(f"Expected list, got {type(parsed_json)}")

            processing_time = int((time.time() - start_time) * 1000)

            # Update log with complete debug info
            log.status = "completed"
            log.output_text = json.dumps(parsed_json)
            log.processing_time_ms = processing_time
            log.raw_llm_response = raw_response_data
            log.parsed_output = parsed_json
            log.debug_info = debug_info
            log.save()

            logger.info(f"Schedule parsing successful: {len(parsed_json)} items")

            return {
                "success": True,
                "schedule_items": parsed_json,
                "raw_response": response_text,
                "processing_time_ms": processing_time,
            }

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)

            # Update log with error debug info
            log.status = "failed"
            log.error_message = str(e)
            log.processing_time_ms = processing_time
            if "raw_response_data" in locals():
                log.raw_llm_response = raw_response_data
            if "debug_info" in locals():
                log.debug_info = debug_info
            log.save()

            logger.error(f"Schedule parsing failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time,
            }


class EventTranslationService(BaseAIService):
    """Service for translating event content using AI with simple prompts."""

    def detect_language(self, text: str, lenient: bool = False) -> str:
        """Detect language of text using simple prompt."""
        if not text or not text.strip():
            return "unknown"

        try:
            if lenient:
                prompt = f"""Detect the PRIMARY language of this text. If it's mostly Polish but has some English words (like event names), return "pl". If it's mostly English but has some Polish words, return "en".

Text: {text}

Return ONLY the language code as JSON:
{{"language": "en"}} or {{"language": "pl"}}

JSON OUTPUT:"""
            else:
                prompt = f"""Detect the language of this text. Return "en" for English or "pl" for Polish.

Text: {text}

Return ONLY the language code as JSON:
{{"language": "en"}} or {{"language": "pl"}}

JSON OUTPUT:"""

            try:
                response = self.invoke_with_fallback(
                    prompt, config={"callbacks": [self.callback_handler]}
                )
            except Exception as llm_error:
                # Handle rate limit errors with backoff
                self._handle_rate_limit_error(llm_error)
                # Re-raise after backoff
                raise

            response_text = (
                response.content if hasattr(response, "content") else str(response)
            )

            logger.info(f"Language detection raw response: {response_text}")
            logger.info(
                f"Language detection response metadata: {getattr(response, 'response_metadata', None)}"
            )

            result = self._parse_json_response(response_text)
            language = result.get("language", "unknown")

            logger.info(f"Language detected for '{text[:50]}...': {language}")
            return language

        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}", exc_info=True)
            return "unknown"

    def translate_text(
        self, text: str, source_lang: str, target_lang: str, is_title: bool = False
    ) -> Dict[str, Any]:
        start_time = time.time()

        if not text or not text.strip():
            return {
                "success": True,
                "translated_text": "",
                "source_lang": source_lang,
                "target_lang": target_lang,
                "processing_time_ms": 0,
            }

        lang_names = {"en": "English", "pl": "Polish"}
        content_type = "title" if is_title else "description"
        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(target_lang, target_lang)

        prompt = f"""You are an expert translator. Translate this event {content_type} from {source_name} to {target_name}.

CRITICAL RULES - READ CAREFULLY:

1. DO NOT TRANSLATE ANY PROPER NOUNS OR UNIQUE NAMES:
   - Event names: "Neurohackathon", "Heroes of the Brain", "BudQuiz", "Open'er Festival", "Unsound", "PWr Party"
   - Venue names: "Tauron Arena", "ICE Kraków", "Klub Studio", "Klub Cherry"
   - Brand/product names: ANY capitalized unique names
   - Organization / institution names: "PWr", "Politechnika Wrocławska"
   - City names: "Kraków", "Warszawa", "Gdańsk", "Wrocław"
   - People's names
   - ANY word that looks like a unique name or brand (capitalized, mixed-case, or unique combination)

2. ESPECIALLY (VERY IMPORTANT):
   - "BudQuiz", "PWr Party" = event series names, DO NOT TRANSLATE
   - "Klub Cherry", "Klub Studio" = venue names, DO NOT TRANSLATE

3. DO TRANSLATE (these are NOT proper nouns):
   - Field labels: "Miejsce:" → "Location:", "Szatnia:" → "Cloakroom:", "Data:" → "Date:", "Dress code:" → "Dress code:"
   - Category labels: "Studenci PWr" → "PWr Students", "Reszta świata" → "Rest of the world"
   - Generic descriptive text and phrases

4. ONLY translate:
   - Descriptive sentences and phrases
   - Field labels and category names (as listed above)
   - Common generic words: "concert", "festival", "exhibition", "event", "tickets", "party"
   - Descriptive adjectives: "amazing", "great", "beautiful", "magical"
   - Action verbs: "join", "participate", "watch", "prepare", "see"
   - Generic nouns: "music", "art", "food", "drinks", "atmosphere"

5. WHEN IN DOUBT - DO NOT TRANSLATE! If a word/phrase could be a unique name or brand, leave it unchanged.

6. PRESERVE ALL formatting, emojis (🧠, 🦸‍♀️, 🎁, 🎄, 🍒, etc.), and line breaks exactly.

Text to translate:
{text}

Remember:
- Proper nouns, event names, venue names MUST stay in original language
- Field labels (e.g. "Miejsce:", "Szatnia:") and category names (e.g. "Studenci PWr", "Reszta świata") SHOULD be translated
- Only translate descriptive content, generic words, labels, and categories

Return ONLY a JSON object:
{{"translated_text": "your translation here"}}

JSON OUTPUT:"""

        logger.info(
            f"Translation: {content_type} {source_lang}->{target_lang}, length={len(text)}"
        )

        debug_info = {
            "content_type": content_type,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "is_title": is_title,
            "input_length": len(text),
            "parsing_attempts": [],
        }

        try:
            # Invoke LLM
            try:
                response = self.invoke_with_fallback(
                    prompt, config={"callbacks": [self.callback_handler]}
                )
            except Exception as llm_error:
                # Handle rate limit errors with backoff
                self._handle_rate_limit_error(llm_error)
                # Re-raise after backoff
                raise

            response_text = (
                response.content if hasattr(response, "content") else str(response)
            )

            # Collect raw response data
            raw_response_data = {
                "content": response_text,
                "type": str(type(response)),
                "response_metadata": getattr(response, "response_metadata", None),
                "usage_metadata": getattr(response, "usage_metadata", None),
                "additional_kwargs": getattr(response, "additional_kwargs", None),
            }

            logger.info(f"Translation raw response: {response_text[:200]}...")
            logger.info(
                f"Translation response metadata: {raw_response_data['response_metadata']}"
            )

            # Parse JSON
            try:
                result = self._parse_json_response(response_text)
                debug_info["parsing_attempts"].append(
                    {
                        "success": True,
                        "method": "standard",
                        "result_type": str(type(result)),
                    }
                )
            except Exception as parse_error:
                debug_info["parsing_attempts"].append(
                    {
                        "success": False,
                        "method": "standard",
                        "error": str(parse_error),
                        "raw_text_preview": response_text[:500],
                    }
                )
                raise

            if not isinstance(result, dict):
                raise ValueError(f"Expected dict, got {type(result)}")

            if "translated_text" not in result:
                raise ValueError(f"Missing 'translated_text' in response: {result}")

            translated_text = result["translated_text"]

            if not translated_text:
                raise ValueError("Empty translated_text")

            processing_time = int((time.time() - start_time) * 1000)
            logger.info(f"Translation SUCCESS: {translated_text[:100]}...")

            return {
                "success": True,
                "translated_text": translated_text,
                "source_lang": source_lang,
                "target_lang": target_lang,
                "processing_time_ms": processing_time,
                "raw_response": response_text,
                "raw_response_data": raw_response_data,
                "parsed_output": result,
                "debug_info": debug_info,
            }

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            debug_info["error"] = str(e)
            debug_info["error_type"] = str(type(e))

            logger.error(f"Translation exception: {str(e)}", exc_info=True)

            return {
                "success": False,
                "error": str(e),
                "source_lang": source_lang,
                "target_lang": target_lang,
                "processing_time_ms": processing_time,
                "raw_response_data": (
                    raw_response_data if "raw_response_data" in locals() else None
                ),
                "debug_info": debug_info,
            }

    def translate_event(self, event_id: str, organization, user=None) -> Dict[str, Any]:
        """Translate event content from filled fields to empty fields."""
        from core.models import Event

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return {"success": False, "error": f"Event {event_id} not found"}

        results = {
            "success": True,
            "event_id": str(event_id),
            "translations": [],
            "warnings": [],
            "skipped": [],
        }

        fields_to_check = [
            ("title_pl", "title_en", "pl", "en", True),
            ("title_en", "title_pl", "en", "pl", True),
            ("description_pl", "description_en", "pl", "en", False),
            ("description_en", "description_pl", "en", "pl", False),
        ]

        for (
            source_field,
            target_field,
            source_lang,
            target_lang,
            is_title,
        ) in fields_to_check:
            source_text = getattr(event, source_field, None)
            target_text = getattr(event, target_field, None)

            if not source_text or not source_text.strip():
                continue

            if target_text and target_text.strip():
                results["skipped"].append(
                    {"field": target_field, "reason": "Already exists"}
                )
                continue

            # Detect language (lenient for titles)
            detected_lang = self.detect_language(source_text, lenient=is_title)

            if detected_lang == "unknown":
                results["warnings"].append(
                    {"field": source_field, "message": "Could not detect language"}
                )
                continue

            if detected_lang != source_lang:
                msg = f"Language mismatch: expected {source_lang}, detected {detected_lang}"
                logger.warning(f"Event {event_id} {source_field}: {msg}")

                # Be lenient for short titles with English words
                if is_title and len(source_text) < 100:
                    logger.info(f"Ignoring mismatch for title {source_field}")
                else:
                    results["warnings"].append({"field": source_field, "message": msg})
                    continue

            # Translate
            translation = self.translate_text(
                source_text, source_lang, target_lang, is_title
            )

            # Log
            AIProcessingLog.objects.create(
                provider_name=self.provider,
                input_text=source_text,
                prompt_used=f"Translate {source_field} to {target_field}",
                model_used=self.config["model_name"],
                status="completed" if translation["success"] else "failed",
                output_text=translation.get("translated_text", ""),
                error_message=translation.get("error"),
                processing_time_ms=translation.get("processing_time_ms", 0),
                raw_llm_request={
                    "source_field": source_field,
                    "target_field": target_field,
                    "source_lang": source_lang,
                    "target_lang": target_lang,
                    "is_title": is_title,
                    "provider": self.provider,
                    "model": self.config["model_name"],
                },
                raw_llm_response=translation.get("raw_response_data"),
                parsed_output=translation.get("parsed_output"),
                debug_info=translation.get("debug_info"),
                organization=organization,
                user=user,
            )

            if translation["success"]:
                setattr(event, target_field, translation["translated_text"])
                results["translations"].append(
                    {
                        "source_field": source_field,
                        "target_field": target_field,
                        "translated_text": translation["translated_text"],
                        "tokens_used": 0,
                        "processing_time_ms": translation.get("processing_time_ms", 0),
                        "raw_response": translation.get("raw_response", ""),
                    }
                )
            else:
                results["warnings"].append(
                    {
                        "field": source_field,
                        "message": f"Translation failed: {translation.get('error')}",
                    }
                )

        if results["translations"]:
            event.save()

        return results


class EventExtractionService(BaseAIService):
    """Service for extracting event information from images using AI."""

    def extract_event_info(self, image_file, organization=None, user=None, categories=None, organizations=None) -> Dict[str, Any]:
        """
        Extract event information from an image file.

        Args:
            image_file: Django UploadedFile or file-like object
            organization: Organization context
            user: User context
            categories: List of available category names to choose from
            organizations: List of available organization names to choose from

        Returns:
            Dict containing extracted fields
        """
        import base64
        import datetime
        from langchain_core.messages import HumanMessage

        start_time = time.time()

        try:
            # Read and encode image
            if hasattr(image_file, "read"):
                image_data = image_file.read()
                # Reset file pointer if possible
                if hasattr(image_file, "seek"):
                    image_file.seek(0)
            else:
                image_data = image_file

            b64_image = base64.b64encode(image_data).decode("utf-8")

            # Determine mime type
            file_name = getattr(image_file, "name", "image.jpg").lower()
            mime_type = "image/png" if file_name.endswith(".png") else "image/jpeg"
            image_url = f"data:{mime_type};base64,{b64_image}"

            current_date = datetime.date.today().strftime("%Y-%m-%d")
            categories_str = ", ".join(categories) if categories else "General"
            organizations_str = ", ".join(organizations) if organizations else "None"

            prompt_text = f"""Analyze this event poster/image and extract the following information.
            
            Context:
            - Current Date: {current_date}
            - Available Categories: {categories_str}
            - Available Organizations: {organizations_str}
            
            Return a JSON object with these fields:
            - title_pl: Title in Polish (translate if necessary)
            - title_en: Title in English (translate if necessary)
            - description_pl: Detailed description in Polish (extract all relevant info: agenda, guests, rules, etc.)
            - description_en: Detailed description in English
            - starts_at: Start date and time (YYYY-MM-DD HH:MM).
            - ends_at: End date and time (YYYY-MM-DD HH:MM).
            - location: Venue name and address.
            - organization: The exact name of the organization from the list above that is organizing this event.
            - url: Any URL mentioned (tickets, website, link to the event in the image (look for facebook)).
            - category: The exact name of the category from the list above that best fits this event.
            
            1. DO NOT TRANSLATE ANY PROPER NOUNS OR UNIQUE NAMES:
            - Event names: "Neurohackathon", "Heroes of the Brain", "BudQuiz", "Open'er Festival", "Unsound", "PWr Party"
            - Venue names: "Tauron Arena", "ICE Kraków", "Klub Studio", "Klub Cherry"
            - Brand/product names: ANY capitalized unique names
            - Organization / institution names: "PWr", "Politechnika Wrocławska"
            - City names: "Kraków", "Warszawa", "Gdańsk", "Wrocław"
            - People's names
            - ANY word that looks like a unique name or brand (capitalized, mixed-case, or unique combination)

            2. ESPECIALLY (VERY IMPORTANT):
            - "BudQuiz", "PWr Party" = event series names, DO NOT TRANSLATE
            - "Klub Cherry", "Klub Studio" = venue names, DO NOT TRANSLATE

            3. DO TRANSLATE (these are NOT proper nouns):
            - Field labels: "Miejsce:" → "Location:", "Szatnia:" → "Cloakroom:", "Data:" → "Date:", "Dress code:" → "Dress code:"
            - Category labels: "Studenci PWr" → "PWr Students", "Reszta świata" → "Rest of the world"
            - Generic descriptive text and phrases

            4. ONLY translate:
            - Descriptive sentences and phrases
            - Field labels and category names (as listed above)
            - Common generic words: "concert", "festival", "exhibition", "event", "tickets", "party"
            - Descriptive adjectives: "amazing", "great", "beautiful", "magical"
            - Action verbs: "join", "participate", "watch", "prepare", "see"
            - Generic nouns: "music", "art", "food", "drinks", "atmosphere"

            5. WHEN IN DOUBT - DO NOT TRANSLATE! If a word/phrase could be a unique name or brand, leave it unchanged.

            6. PRESERVE ALL formatting, emojis (🧠, 🦸‍♀️, 🎁, 🎄, 🍒, etc.), and line breaks exactly.


            CRITICAL INSTRUCTIONS:
            1. If text is in PL, fill PL fields and TRANSLATE to EN.
            2. If text is in EN, fill EN fields and TRANSLATE to PL.
            3. DATES: 
               - If year is missing, assume the NEXT occurrence of that date relative to {current_date}.
               - Example: If today is 2025-11-29 and event is "Dec 5", it is 2025-12-05.
               - Example: If today is 2025-11-29 and event is "Jan 5", it is 2026-01-05.
            4. CATEGORY: Must be one of the provided Available Categories.
            5. ORGANIZATION: Must be one of the provided Available Organizations.
            6. if theres no end date assume its the same day as it starts at 23:59.
            7. Return ONLY valid JSON.
            
            JSON OUTPUT:"""

            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt_text},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ]
            )

            # Create log entry
            log = AIProcessingLog.objects.create(
                provider_name=self.provider,
                input_text=f"Image upload: {file_name}",
                prompt_used=prompt_text,
                model_used=self.config["model_name"],
                status="processing",
                organization=organization,
                user=user,
                tokens_used=0,
                raw_llm_request={
                    "provider": self.provider,
                    "model": self.config["model_name"],
                    "file_name": file_name,
                    "mime_type": mime_type,
                    "image_size": len(image_data),
                },
            )

            # Invoke LLM
            try:
                response = self.invoke_with_fallback(
                    [message], config={"callbacks": [self.callback_handler]}
                )
            except Exception as llm_error:
                self._handle_rate_limit_error(llm_error)
                raise

            response_text = (
                response.content if hasattr(response, "content") else str(response)
            )

            # Store raw response
            raw_response_data = {
                "content": response_text,
                "type": str(type(response)),
                "response_metadata": getattr(response, "response_metadata", None),
                "usage_metadata": getattr(response, "usage_metadata", None),
            }

            logger.info(f"Event extraction raw response: {response_text[:200]}...")

            # Parse JSON
            debug_info = {"parsing_attempts": []}

            try:
                result = self._parse_json_response(response_text)
                debug_info["parsing_attempts"].append(
                    {
                        "success": True,
                        "method": "standard",
                        "result_type": str(type(result)),
                    }
                )
            except Exception as parse_error:
                debug_info["parsing_attempts"].append(
                    {"success": False, "method": "standard", "error": str(parse_error)}
                )
                raise

            processing_time = int((time.time() - start_time) * 1000)

            # Update log
            log.status = "completed"
            log.output_text = json.dumps(result)
            log.processing_time_ms = processing_time
            log.raw_llm_response = raw_response_data
            log.parsed_output = result
            log.debug_info = debug_info
            log.save()

            return {
                "success": True,
                "data": result,
                "processing_time_ms": processing_time,
            }

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)

            if "log" in locals():
                log.status = "failed"
                log.error_message = str(e)
                log.processing_time_ms = processing_time
                log.save()

            logger.error(f"Event extraction failed: {str(e)}", exc_info=True)

            return {
                "success": False,
                "error": str(e),
                "processing_time_ms": processing_time,
            }
