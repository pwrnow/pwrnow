import json
import time
import logging
from typing import Dict, Any, List, Literal, Optional
from django.conf import settings
from .models import AIProcessingLog

# Try to import local utils, handle potential import errors gracefully if running in isolation
try:
    from utils.posthog_ai import posthog
    from posthog.ai.langchain import CallbackHandler
except ImportError:
    # Fallback for testing environment or if modules are missing
    posthog = None
    class CallbackHandler:
        def __init__(self, client, privacy_mode=False):
            pass

from pydantic import BaseModel, Field
from langchain.schema import SystemMessage, HumanMessage

logger = logging.getLogger(__name__)

# --- Pydantic Models for Structured Output ---

class ScheduleItem(BaseModel):
    """A single schedule item extracted from text."""
    date: str = Field(description="Date of the event in YYYY-MM-DD format")
    start_time: str = Field(description="Start time in HH:MM format")
    end_time: Optional[str] = Field(description="End time in HH:MM format (optional)", default=None)
    title: str = Field(description="Title of the session/event")
    description: Optional[str] = Field(description="Description of the session/event", default=None)

class ScheduleParsingOutput(BaseModel):
    """Output for schedule parsing containing a list of items."""
    schedule_items: List[ScheduleItem] = Field(description="List of extracted schedule items")


class LanguageDetectionOutput(BaseModel):
    """Detected language of the text."""
    language: Literal['en', 'pl'] = Field(
        description="Two-letter ISO 639-1 language code. Only 'en' for English or 'pl' for Polish."
    )

class TranslationOutput(BaseModel):
    """Translated text output."""
    translated_text: str = Field(
        description="The translated text in the target language. Proper nouns should be preserved."
    )


class BaseAIService:
    """Base service for AI operations."""

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

    DEFAULT_PROVIDER = 'openai'

    def __init__(self):
        self.provider = getattr(settings, 'AI_PROVIDER', self.DEFAULT_PROVIDER)

        if self.provider not in self.PROVIDER_CONFIGS:
            raise ValueError(f"Unsupported provider: {self.provider}. Supported providers: {list(self.PROVIDER_CONFIGS.keys())}")

        self.config = self.PROVIDER_CONFIGS[self.provider]

        self.callback_handler = CallbackHandler(
            client=posthog,
            privacy_mode=False
        )

        self._init_llm()

    def _init_llm(self):
        try:
            if self.provider == 'openai':
                from langchain_openai import ChatOpenAI
                self.llm = ChatOpenAI(
                    model=self.config['model_name'],
                    temperature=self.config['temperature'],
                    max_tokens=self.config['max_tokens'],
                    openai_api_key=getattr(settings, 'OPENAI_API_KEY', None)
                )
            elif self.provider == 'gemini':
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model=self.config['model_name'],
                    temperature=self.config['temperature'],
                    max_tokens=self.config['max_tokens'],
                    google_api_key=getattr(settings, 'GEMINI_API_KEY', None)
                )
        except ImportError:
            msg = "Missing required packages. "
            if self.provider == 'openai':
                msg += "Install langchain-openai."
            else:
                msg += "Install langchain-google-genai google-generativeai."
            raise ImportError(msg)
        except Exception as e:
            logger.error(f"Failed to initialize LangChain for provider {self.provider}: {str(e)}")
            raise


class ScheduleParsingService(BaseAIService):
    """Service for parsing schedule text using AI."""

    SYSTEM_MESSAGE = """You are an expert at parsing event schedules from raw text.
    Extract schedule items and format them as structured JSON data.

    Guidelines:
    1. Extract all schedule items with dates, times, titles, and descriptions
    2. Parse dates (MM/DD/YYYY, DD/MM/YYYY, "Monday", etc.) to YYYY-MM-DD
    3. Parse times to HH:MM
    4. Use today's date if not specified
    5. Estimate duration if end time missing
    6. Handle Polish time expressions (od/do)
    7. Split compound items ("breakfast then party")
    8. Always return at least one item if time info exists
    """

    PROMPT_TEMPLATE = """Event Info:
    Title: {event_title}
    Date Range: {event_start_date} to {event_end_date}

    Raw Text:
    {raw_text}

    Extract schedule items."""

    def parse_schedule(self, raw_text: str, organization, user=None, event_title=None, event_start_date=None, event_end_date=None) -> Dict[str, Any]:
        start_time = time.time()

        prompt_content = self.PROMPT_TEMPLATE.format(
            raw_text=raw_text,
            event_title=event_title or '',
            event_start_date=event_start_date or '',
            event_end_date=event_end_date or ''
        )

        log = AIProcessingLog.objects.create(
            provider_name=self.provider,
            input_text=raw_text,
            prompt_used=prompt_content,
            model_used=self.config['model_name'],
            status='processing',
            organization=organization,
            user=user
        )

        try:
            # Use structured output for schedule parsing too
            structured_llm = self.llm.with_structured_output(ScheduleParsingOutput)

            messages = [
                SystemMessage(content=self.SYSTEM_MESSAGE),
                HumanMessage(content=prompt_content)
            ]

            result = structured_llm.invoke(messages, config={'callbacks': [self.callback_handler]})

            # Convert Pydantic models to dicts
            parsed_schedule = [item.model_dump() for item in result.schedule_items]

            processing_time = int((time.time() - start_time) * 1000)
            log.status = 'completed'
            log.output_text = json.dumps(parsed_schedule)
            log.processing_time_ms = processing_time
            log.save()

            return {
                'success': True,
                'schedule_items': parsed_schedule,
                'raw_response': log.output_text,
                'processing_time_ms': processing_time
            }

        except Exception as e:
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


class EventTranslationService(BaseAIService):
    """Service for translating event content using AI with LangChain structured output."""

    def detect_language(self, text: str) -> str:
        """Detect language of text."""
        if not text or not text.strip():
            return 'unknown'

        try:
            structured_llm = self.llm.with_structured_output(LanguageDetectionOutput)

            prompt = f"""Detect the language of the following text.

            Text: {text}"""

            result = structured_llm.invoke(prompt, config={'callbacks': [self.callback_handler]})
            return result.language

        except Exception as e:
            logger.error(f"Language detection failed: {str(e)}")
            return 'unknown'

    def translate_text(self, text: str, source_lang: str, target_lang: str, is_title: bool = False) -> Dict[str, Any]:
        start_time = time.time()

        if not text or not text.strip():
            return {
                'success': True,
                'translated_text': '',
                'source_lang': source_lang,
                'target_lang': target_lang,
                'processing_time_ms': 0
            }

        lang_names = {'en': 'English', 'pl': 'Polish'}
        content_type = "title" if is_title else "description"
        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(target_lang, target_lang)

        # Revised prompt to be less restrictive but still safe
        prompt = f"""Translate the following event {content_type} from {source_name} to {target_name}.

Rules:
1. Translate the content naturally.
2. Do NOT translate proper nouns (e.g., specific names of events, bands, venues, cities like "Kraków", "Warszawa").
3. Keep original formatting.

Text to translate:
{text}"""

        try:
            structured_llm = self.llm.with_structured_output(TranslationOutput)

            result = structured_llm.invoke(prompt, config={'callbacks': [self.callback_handler]})

            processing_time = int((time.time() - start_time) * 1000)

            return {
                'success': True,
                'translated_text': result.translated_text,
                'source_lang': source_lang,
                'target_lang': target_lang,
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
        """Translate event content from filled fields to empty fields."""
        from core.models import Event

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return {'success': False, 'error': f'Event {event_id} not found'}

        results = {
            'success': True,
            'event_id': str(event_id),
            'translations': [],
            'warnings': [],
            'skipped': []
        }

        # Check which fields need translation
        # (source_field, target_field, source_lang, target_lang, is_title)
        fields_to_check = [
            ('title_pl', 'title_en', 'pl', 'en', True),
            ('title_en', 'title_pl', 'en', 'pl', True),
            ('description_pl', 'description_en', 'pl', 'en', False),
            ('description_en', 'description_pl', 'en', 'pl', False),
        ]

        for source_field, target_field, source_lang, target_lang, is_title in fields_to_check:
            source_text = getattr(event, source_field, None)
            target_text = getattr(event, target_field, None)

            if not source_text or not source_text.strip():
                continue

            if target_text and target_text.strip():
                results['skipped'].append({'field': target_field, 'reason': 'Already exists'})
                continue

            # Detect language
            detected_lang = self.detect_language(source_text)

            if detected_lang == 'unknown':
                results['warnings'].append({'field': source_field, 'message': 'Could not detect language'})
                continue

            if detected_lang != source_lang:
                msg = f'Language mismatch in {source_field}: expected {source_lang}, detected {detected_lang}'
                logger.warning(f"Event {event_id}: {msg}")
                results['warnings'].append({'field': source_field, 'message': msg})
                continue

            # Translate
            translation = self.translate_text(source_text, source_lang, target_lang, is_title)

            # Log
            log_status = 'completed' if translation['success'] else 'failed'
            AIProcessingLog.objects.create(
                provider_name=self.provider,
                input_text=source_text,
                prompt_used=f"Translate {source_field} to {target_field}",
                model_used=self.config['model_name'],
                status=log_status,
                output_text=translation.get('translated_text', ''),
                error_message=translation.get('error'),
                processing_time_ms=translation.get('processing_time_ms', 0),
                organization=organization,
                user=user
            )

            if translation['success']:
                setattr(event, target_field, translation['translated_text'])
                results['translations'].append({
                    'source_field': source_field,
                    'target_field': target_field,
                    'translated_text': translation['translated_text'],
                    'tokens_used': translation.get('tokens_used', 0),
                    'processing_time_ms': translation.get('processing_time_ms', 0)
                })
            else:
                results['warnings'].append({
                    'field': source_field,
                    'message': f"Translation failed: {translation.get('error')}"
                })

        if results['translations']:
            event.save()

        return results
