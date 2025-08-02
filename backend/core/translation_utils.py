"""
Translation utilities for handling language-aware content delivery.
"""

from typing import Optional, Dict, Any
from django.conf import settings


def get_language_from_request(request) -> str:
    """
    Extract language from request query parameters.

    Args:
        request: Django request object

    Returns:
        Language code (defaults to 'pl' if not specified or invalid)
    """
    if not request or not hasattr(request, 'query_params'):
        return 'pl'

    lang = request.query_params.get('lang', 'pl').lower()

    # Validate language code against supported languages
    supported_languages = [code for code, name in settings.LANGUAGES]

    if lang in supported_languages:
        return lang

    # Default to Polish if invalid language provided
    return 'pl'


def get_translated_field(obj, field_name: str, language: str) -> Any:
    """
    Get the translated field value for a specific language with fallback.

    Args:
        obj: Model instance
        field_name: Base field name (e.g., 'title', 'name')
        language: Language code (e.g., 'en', 'pl')

    Returns:
        Translated field value with fallback logic
    """
    # Try to get the language-specific field first
    translated_field = f"{field_name}_{language}"

    if hasattr(obj, translated_field):
        value = getattr(obj, translated_field)
        if value is not None and value.strip():  # Check for non-empty string
            return value

    # Fallback to the base field (usually Polish as per modeltranslation config)
    if hasattr(obj, field_name):
        base_value = getattr(obj, field_name)
        if base_value is not None and str(base_value).strip():
            return base_value

    # Fallback to other language versions if both above are empty
    fallback_languages = getattr(settings, 'MODELTRANSLATION_FALLBACK_LANGUAGES', ['pl', 'en'])

    for fallback_lang in fallback_languages:
        if fallback_lang != language:  # Don't check the same language again
            fallback_field = f"{field_name}_{fallback_lang}"
            if hasattr(obj, fallback_field):
                fallback_value = getattr(obj, fallback_field)
                if fallback_value is not None and str(fallback_value).strip():
                    return fallback_value

    return None


def prepare_translated_data(obj, fields: Dict[str, str], language: str) -> Dict[str, Any]:
    """
    Prepare translated data for multiple fields of an object.

    Args:
        obj: Model instance
        fields: Dictionary mapping output field names to model field names
                e.g., {'title': 'title', 'description': 'description'}
        language: Language code

    Returns:
        Dictionary with translated field values
    """
    translated_data = {}

    for output_field, model_field in fields.items():
        translated_data[output_field] = get_translated_field(obj, model_field, language)

    return translated_data


