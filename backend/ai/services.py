import json
import time
import logging
from typing import Dict, Any, List
from django.conf import settings
from .models import AIProcessingLog

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

            response = self.llm.invoke(messages)
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