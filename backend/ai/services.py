import json
import time
import logging
from typing import Dict, Any, List
from django.conf import settings
from .models import AIProcessingLog

from utils.posthog_ai import posthog
from posthog.ai.langchain import CallbackHandler



logger = logging.getLogger(__name__)


class ScheduleParsingService:
    """Service for parsing schedule text using AI with LangChain."""

    # Provider configurations
    PROVIDER_CONFIGS = {
        'openai': {
            'model_name': 'gpt-4o-mini',
            'temperature': 0.3,
            'max_tokens': 4000,
        },
        'gemini': {
            'model_name': 'gemini-2.0-flash',
            'temperature': 0.3,
            'max_tokens': 4000,
        }
    }

    # Default provider
    DEFAULT_PROVIDER = 'openai'

#TODO: add the date check to the prompt

    # Hardcoded templates in English
    SYSTEM_MESSAGE = """You are an expert at parsing event schedules from raw text in any language. Your task is to extract schedule items and format them as structured JSON data.

Guidelines:
1. Extract all schedule items with dates, times, titles, and descriptions
2. Parse dates in various formats (MM/DD/YYYY, DD/MM/YYYY, "Monday", "Jan 15", etc.)
3. Parse times in various formats (9:00 AM, 14:30, "2:30 PM", "od 9 do 12", "do 20", etc.)
4. If no date is specified, use today's date
5. If no end time is specified, estimate duration based on title/description
6. Clean up titles and descriptions, removing unnecessary formatting
7. Return ONLY valid JSON array, no other text
8. Handle Polish time expressions: "od X do Y" means "from X to Y", "do X" means "until X"
9. For text like "sniadanie od 9 do 12 a potem zabawa do 20", create two schedule items
10. Always return at least one schedule item if there's any time information in the text

Expected JSON format:
[
  {
    "date": "YYYY-MM-DD",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "title": "Session Title",
    "description": "Optional description"
  }
]"""

    PROMPT_TEMPLATE = """Please parse the following raw schedule text and extract all schedule items. Return the result as a JSON array.

Event Information:
- Title: {event_title}
- Date Range: {event_start_date} to {event_end_date}

Raw Schedule Text:
{raw_text}

Please extract all schedule items and return them as a JSON array following the format specified in the system message."""

    def __init__(self):
        """Initialize the service with LangChain using the configured provider."""
        self.provider = getattr(settings, 'AI_PROVIDER', self.DEFAULT_PROVIDER)

        if self.provider not in self.PROVIDER_CONFIGS:
            raise ValueError(f"Unsupported provider: {self.provider}. Supported providers: {list(self.PROVIDER_CONFIGS.keys())}")

        config = self.PROVIDER_CONFIGS[self.provider]

        self.callback_handler = CallbackHandler(
            client=posthog, # This is an optional parameter. If it is not provided, a default client will be used.
            # distinct_id="user_123", # optional
            # trace_id="trace_456", # optional
            # properties={"conversation_id": "abc123"} # optional
            # groups={"company": "company_id_in_your_db"} # optional
            privacy_mode=False # optional
        )

        try:
            from langchain.schema import SystemMessage, HumanMessage

            if self.provider == 'openai':
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model=config['model_name'],
                    temperature=config['temperature'],
                    max_tokens=config['max_tokens'],
                    openai_api_key=getattr(settings, 'OPENAI_API_KEY', None)
                )
            elif self.provider == 'gemini':
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=config['model_name'],
                    temperature=config['temperature'],
                    max_tokens=config['max_tokens'],
                    google_api_key=getattr(settings, 'GEMINI_API_KEY', None)
                )

            self.SystemMessage = SystemMessage
            self.HumanMessage = HumanMessage

        except ImportError as e:
            if self.provider == 'openai':
                raise ImportError("LangChain OpenAI packages are required. Install with: pip install langchain langchain-openai")
            elif self.provider == 'gemini':
                raise ImportError("LangChain Google GenAI packages are required. Install with: pip install langchain langchain-google-genai google-generativeai")
        except Exception as e:
            logger.error(f"Failed to initialize LangChain for provider {self.provider}: {str(e)}")
            raise

    def parse_schedule(self, raw_text: str, organization, user=None, event_title=None, event_start_date=None, event_end_date=None) -> Dict[str, Any]:
        """Parse raw schedule text into structured format."""
        start_time = time.time()

        # Format the prompt first
        prompt = self._format_prompt(raw_text, event_title, event_start_date, event_end_date)

        # Create processing log
        config = self.PROVIDER_CONFIGS[self.provider]
        log = AIProcessingLog.objects.create(
            provider_name=self.provider,
            input_text=raw_text,
            prompt_used=prompt,
            model_used=config['model_name'],
            status='processing',
            organization=organization,
            user=user
        )

        try:

            # Process with AI using LangChain
            messages = [
                self.SystemMessage(content=self.SYSTEM_MESSAGE),
                self.HumanMessage(content=prompt)
            ]

            response = self.llm.invoke(messages, callbacks=[self.callback_handler])
            content = response.content

            # Parse the response
            parsed_schedule = self._parse_ai_response(content)

            # Update log
            processing_time = int((time.time() - start_time) * 1000)
            log.status = 'completed'
            log.output_text = content
            log.tokens_used = getattr(response, 'usage_metadata', {}).get('total_tokens', 0)
            log.processing_time_ms = processing_time
            log.save()

            return {
                'success': True,
                'schedule_items': parsed_schedule,
                'raw_response': content,
                'tokens_used': getattr(response, 'usage_metadata', {}).get('total_tokens', 0),
                'processing_time_ms': processing_time
            }

        except Exception as e:
            # Update log with error
            processing_time = int((time.time() - start_time) * 1000)
            log.status = 'failed'
            log.error_message = str(e)
            log.processing_time_ms = processing_time
            log.save()

            logger.error(f"Schedule parsing failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'processing_time_ms': processing_time
            }

    def _format_prompt(self, raw_text: str, event_title: str = None, event_start_date: str = None, event_end_date: str = None) -> str:
        """Format the prompt template with the raw text and event information."""
        prompt = self.PROMPT_TEMPLATE

        # Replace placeholders with actual values or fallback to empty strings
        prompt = prompt.replace('{raw_text}', raw_text)
        prompt = prompt.replace('{event_title}', event_title or '')
        prompt = prompt.replace('{event_start_date}', event_start_date or '')
        prompt = prompt.replace('{event_end_date}', event_end_date or '')

        return prompt

    def _parse_ai_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured schedule items."""
        try:
            text = response.strip()

            # Strip code fences like ```json ... ``` or ``` ... ```
            if text.startswith("```"):
                import re
                fence_match = re.search(r"^```[a-zA-Z0-9_-]*\s*([\s\S]*?)\n```", text)
                if fence_match:
                    text = fence_match.group(1).strip()

            # Direct JSON content
            if text.startswith('{') or text.startswith('['):
                result = json.loads(text)
                if isinstance(result, dict):
                    return [result]
                if isinstance(result, list):
                    return result
                return []

            # Search for a JSON array first
            import re
            array_match = re.search(r"\[[\s\S]*\]", text)
            if array_match:
                try:
                    result = json.loads(array_match.group())
                    if isinstance(result, dict):
                        return [result]
                    if isinstance(result, list):
                        return result
                except json.JSONDecodeError:
                    pass

            # Search for a JSON object
            object_match = re.search(r"\{[\s\S]*\}", text)
            if object_match:
                try:
                    result = json.loads(object_match.group())
                    if isinstance(result, dict):
                        return [result]
                    if isinstance(result, list):
                        return result
                except json.JSONDecodeError:
                    pass

            logger.warning("Could not parse AI response as JSON")
            return []

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return []


class EventTranslationService:
    """Service for translating event content using AI with LangChain structured output."""

    # Provider configurations (same as ScheduleParsingService)
    PROVIDER_CONFIGS = {
        'openai': {
            'model_name': 'gpt-4o-mini',
            'temperature': 0.3,
            'max_tokens': 2000,
        },
        'gemini': {
            'model_name': 'gemini-2.0-flash',
            'temperature': 0.3,
            'max_tokens': 2000,
        }
    }

    # Default provider
    DEFAULT_PROVIDER = 'openai'

    def __init__(self):
        """Initialize the service with LangChain using the configured provider."""
        from pydantic import BaseModel, Field
        from typing import Literal

        # Define Pydantic models for structured output
        class LanguageDetection(BaseModel):
            """Detected language of the text."""
            language: Literal['en', 'pl'] = Field(
                description="Two-letter ISO 639-1 language code. Only 'en' for English or 'pl' for Polish."
            )

        class Translation(BaseModel):
            """Translated text with proper noun preservation."""
            translated_text: str = Field(
                description="The translated text. Preserve ALL proper nouns (event names, venues, places, brands, organizations). Only translate generic descriptive words."
            )

        self.LanguageDetection = LanguageDetection
        self.Translation = Translation

        self.provider = getattr(settings, 'AI_PROVIDER', self.DEFAULT_PROVIDER)

        if self.provider not in self.PROVIDER_CONFIGS:
            raise ValueError(f"Unsupported provider: {self.provider}. Supported providers: {list(self.PROVIDER_CONFIGS.keys())}")

        config = self.PROVIDER_CONFIGS[self.provider]

        self.callback_handler = CallbackHandler(
            client=posthog,
            privacy_mode=False
        )

        try:
            if self.provider == 'openai':
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model=config['model_name'],
                    temperature=config['temperature'],
                    max_tokens=config['max_tokens'],
                    openai_api_key=getattr(settings, 'OPENAI_API_KEY', None)
                )
            elif self.provider == 'gemini':
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=config['model_name'],
                    temperature=config['temperature'],
                    max_tokens=config['max_tokens'],
                    google_api_key=getattr(settings, 'GEMINI_API_KEY', None)
                )

        except ImportError as e:
            if self.provider == 'openai':
                raise ImportError("LangChain OpenAI packages are required. Install with: pip install langchain langchain-openai")
            elif self.provider == 'gemini':
                raise ImportError("LangChain Google GenAI packages are required. Install with: pip install langchain langchain-google-genai google-generativeai")
        except Exception as e:
            logger.error(f"Failed to initialize LangChain for provider {self.provider}: {str(e)}")
            raise

    def detect_language(self, text: str) -> str:
        """
        Detect the language of the provided text using structured output.

        Args:
            text: Text to detect language for

        Returns:
            Two-letter ISO 639-1 language code ('en' or 'pl')
        """
        if not text or not text.strip():
            return 'unknown'

        try:
            # Create LLM with structured output
            structured_llm = self.llm.with_structured_output(self.LanguageDetection)

            # Invoke with the text
            prompt = f"""Detect the language of the following text and return only the language code.

Text: {text}

Return the language code ('en' for English or 'pl' for Polish)."""

            result = structured_llm.invoke(prompt, config={'callbacks': [self.callback_handler]})

            return result.language

        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}")
            return 'unknown'

    def translate_text(self, text: str, source_lang: str, target_lang: str, is_title: bool = False) -> Dict[str, Any]:
        """
        Translate text from source language to target language using structured output.

        Args:
            text: Text to translate
            source_lang: Source language code ('en' or 'pl')
            target_lang: Target language code ('en' or 'pl')
            is_title: Whether this is a title (for context)

        Returns:
            Dict with translation result
        """
        start_time = time.time()

        if not text or not text.strip():
            return {
                'success': True,
                'translated_text': '',
                'source_lang': source_lang,
                'target_lang': target_lang,
                'processing_time_ms': 0
            }

        # Language name mapping
        lang_names = {
            'en': 'English',
            'pl': 'Polish'
        }

        content_type = "title" if is_title else "description"
        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(target_lang, target_lang)

        prompt = f"""You are an expert translator specializing in event content translation.

CRITICAL GUIDELINES:
1. Preserve ALL proper nouns (names of events, festivals, venues, brands, organizations, places)
2. Examples of what to keep unchanged:
   - Event names: "Krakow Film Festival", "Open'er Festival", "Unsound"
   - Venue names: "ICE Kraków", "Tauron Arena", "Klub Studio"
   - Organization names: specific company and organization names
   - Place names: "Kraków", "Warszawa", "Rynek Główny"
3. Only translate generic descriptive words and phrases
4. Maintain the original formatting and punctuation

Examples:
- "Koncert w Tauron Arena" → "Concert at Tauron Arena" (translate "Koncert" but keep "Tauron Arena")
- "Open'er Festival 2024" → "Open'er Festival 2024" (keep as-is, it's a proper noun)
- "Wystawa sztuki współczesnej" → "Contemporary art exhibition" (translate all generic terms)

Now translate this event {content_type} from {source_name} to {target_name}:

{text}"""

        try:
            # Create LLM with structured output
            structured_llm = self.llm.with_structured_output(self.Translation)

            result = structured_llm.invoke(prompt, config={'callbacks': [self.callback_handler]})

            processing_time = int((time.time() - start_time) * 1000)

            return {
                'success': True,
                'translated_text': result.translated_text,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'tokens_used': 0,  # LangChain structured output doesn't expose token counts directly
                'processing_time_ms': processing_time
            }

        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.error(f"Translation failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'source_lang': source_lang,
                'target_lang': target_lang,
                'processing_time_ms': processing_time
            }

    def translate_event(self, event_id: str, organization, user=None) -> Dict[str, Any]:
        """
        Translate event content (title and description) from filled fields to empty fields.

        This method:
        1. Detects which fields are filled and which are empty
        2. Detects the actual language of filled fields
        3. Validates that content language matches field name
        4. Translates content to empty fields
        5. Logs all operations to AIProcessingLog

        Args:
            event_id: UUID of the event to translate
            organization: Organization instance for logging
            user: User instance for logging (optional)

        Returns:
            Dict with translation results and any warnings
        """
        from core.models import Event

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return {
                'success': False,
                'error': f'Event with ID {event_id} not found'
            }

        results = {
            'success': True,
            'event_id': str(event_id),
            'translations': [],
            'warnings': [],
            'skipped': []
        }

        # Check which fields need translation
        fields_to_check = [
            ('title_pl', 'title_en', 'pl', 'en', True),
            ('title_en', 'title_pl', 'en', 'pl', True),
            ('description_pl', 'description_en', 'pl', 'en', False),
            ('description_en', 'description_pl', 'en', 'pl', False),
        ]

        for source_field, target_field, source_lang, target_lang, is_title in fields_to_check:
            source_text = getattr(event, source_field, None)
            target_text = getattr(event, target_field, None)

            # Skip if source is empty or target already has content
            if not source_text or not source_text.strip():
                continue

            if target_text and target_text.strip():
                results['skipped'].append({
                    'field': target_field,
                    'reason': 'Target field already has content'
                })
                continue

            # Detect actual language of source text
            detected_lang = self.detect_language(source_text)

            if detected_lang == 'unknown':
                results['warnings'].append({
                    'field': source_field,
                    'message': f'Could not detect language for {source_field}'
                })
                continue

            # Check if detected language matches expected language
            if detected_lang != source_lang:
                warning_msg = f'Language mismatch in {source_field}: expected {source_lang}, detected {detected_lang}. Skipping translation.'
                logger.warning(f"Event {event_id}: {warning_msg}")
                results['warnings'].append({
                    'field': source_field,
                    'message': warning_msg
                })

                # Create log entry for the warning
                AIProcessingLog.objects.create(
                    provider_name=self.provider,
                    input_text=source_text[:500],  # Truncate for storage
                    prompt_used=f"Language detection for {source_field}",
                    model_used=self.PROVIDER_CONFIGS[self.provider]['model_name'],
                    status='completed',
                    output_text=f"Detected: {detected_lang}, Expected: {source_lang}",
                    organization=organization,
                    user=user
                )
                continue

            # Perform translation
            translation_result = self.translate_text(
                text=source_text,
                source_lang=source_lang,
                target_lang=target_lang,
                is_title=is_title
            )

            # Log the translation
            log_status = 'completed' if translation_result['success'] else 'failed'
            AIProcessingLog.objects.create(
                provider_name=self.provider,
                input_text=source_text,
                prompt_used=f"Translate {source_field} to {target_field}",
                model_used=self.PROVIDER_CONFIGS[self.provider]['model_name'],
                status=log_status,
                output_text=translation_result.get('translated_text', ''),
                error_message=translation_result.get('error'),
                tokens_used=translation_result.get('tokens_used', 0),
                processing_time_ms=translation_result.get('processing_time_ms', 0),
                organization=organization,
                user=user
            )

            if translation_result['success']:
                results['translations'].append({
                    'source_field': source_field,
                    'target_field': target_field,
                    'translated_text': translation_result['translated_text'],
                    'tokens_used': translation_result.get('tokens_used', 0),
                    'processing_time_ms': translation_result.get('processing_time_ms', 0)
                })
            else:
                results['warnings'].append({
                    'field': source_field,
                    'message': f"Translation failed: {translation_result.get('error', 'Unknown error')}"
                })

        return results