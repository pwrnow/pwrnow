"""
Translation configuration for django-modeltranslation.

This file defines which model fields should be translated.
It must be imported for modeltranslation to register the translatable models.
"""

from modeltranslation.translator import translator, TranslationOptions
from .models import Event, Category


class EventTranslationOptions(TranslationOptions):
    """Translation options for Event model."""
    fields = ('title', 'description')
    # Required languages - all translated fields must have content in these languages
    required_languages = ('pl',)  # Polish is required, English is optional


class CategoryTranslationOptions(TranslationOptions):
    """Translation options for Category model."""
    fields = ('name',)
    # Required languages - all translated fields must have content in these languages
    required_languages = ('pl',)  # Polish is required, English is optional


# Register the translation options
translator.register(Event, EventTranslationOptions)
translator.register(Category, CategoryTranslationOptions)