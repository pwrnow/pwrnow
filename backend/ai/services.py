import json
import time
import logging
from typing import Dict, Any, List
from django.conf import settings
from .models import AIProcessingLog

logger = logging.getLogger(__name__)


class ScheduleParsingService:
    """Service for parsing schedule text using AI with LangChain."""

    # Hardcoded configuration
    MODEL_NAME = "gpt-5-nano"
    TEMPERATURE = 0.3
    MAX_TOKENS = 4000

    # Hardcoded templates in English
    SYSTEM_MESSAGE = """You are an expert at parsing event schedules from raw text. Your task is to extract schedule items and format them as structured JSON data.

Guidelines:
1. Extract all schedule items with dates, times, titles, and descriptions
2. Parse dates in various formats (MM/DD/YYYY, DD/MM/YYYY, "Monday", "Jan 15", etc.)
3. Parse times in various formats (9:00 AM, 14:30, "2:30 PM", etc.)
4. If no date is specified, try to infer from context or use the event date range
5. If no end time is specified, estimate duration based on title/description
6. Clean up titles and descriptions, removing unnecessary formatting
7. Return ONLY valid JSON array, no other text

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
        """Initialize the service with LangChain."""
        try:
            from langchain_openai import ChatOpenAI
            from langchain.schema import SystemMessage, HumanMessage

            # Initialize OpenAI with hardcoded configuration
            self.llm = ChatOpenAI(
                model=self.MODEL_NAME,
                temperature=self.TEMPERATURE,
                max_tokens=self.MAX_TOKENS,
                openai_api_key=getattr(settings, 'OPENAI_API_KEY', None)
            )

            self.SystemMessage = SystemMessage
            self.HumanMessage = HumanMessage

        except ImportError:
            raise ImportError("LangChain packages are required. Install with: pip install langchain langchain-openai")
        except Exception as e:
            logger.error(f"Failed to initialize LangChain: {str(e)}")
            raise

    def parse_schedule(self, raw_text: str, organization, user=None) -> Dict[str, Any]:
        """Parse raw schedule text into structured format."""
        start_time = time.time()

        # Create processing log
        log = AIProcessingLog.objects.create(
            provider_name='openai',
            input_text=raw_text,
            prompt_used=self.PROMPT_TEMPLATE,
            model_used=self.MODEL_NAME,
            status='processing',
            organization=organization,
            user=user
        )

        try:
            # Format the prompt
            prompt = self._format_prompt(raw_text)

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

    def _format_prompt(self, raw_text: str) -> str:
        """Format the prompt template with the raw text."""
        prompt = self.PROMPT_TEMPLATE

        # Replace placeholders
        prompt = prompt.replace('{raw_text}', raw_text)
        prompt = prompt.replace('{event_title}', '')
        prompt = prompt.replace('{event_start_date}', '')
        prompt = prompt.replace('{event_end_date}', '')

        return prompt

    def _parse_ai_response(self, response: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured schedule items."""
        try:
            # Try to parse as JSON first
            if response.strip().startswith('{') or response.strip().startswith('['):
                return json.loads(response)

            # If not JSON, try to extract JSON from the response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())

            # Fallback: return empty list
            logger.warning("Could not parse AI response as JSON")
            return []

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            return []