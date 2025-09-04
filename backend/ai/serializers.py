from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class ScheduleParseRequestSerializer(serializers.Serializer):
    """Serializer for schedule parsing requests."""

    raw_text = serializers.CharField(required=True, help_text=_("Raw schedule text to parse"))

    def validate_raw_text(self, value):
        """Validate that raw text is not empty and not too long."""
        if not value.strip():
            raise serializers.ValidationError(_("Raw text cannot be empty."))

        if len(value) > 50000:  # 50KB limit
            raise serializers.ValidationError(_("Raw text is too long. Maximum 50,000 characters allowed."))

        return value.strip()


class ScheduleParseResponseSerializer(serializers.Serializer):
    """Serializer for schedule parsing responses."""

    success = serializers.BooleanField()
    schedule_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text=_("Parsed schedule items")
    )
    raw_response = serializers.CharField(required=False, help_text=_("Raw AI response"))
    error = serializers.CharField(required=False, help_text=_("Error message if parsing failed"))
    tokens_used = serializers.IntegerField(required=False, help_text=_("Number of tokens used"))
    processing_time_ms = serializers.IntegerField(required=False, help_text=_("Processing time in milliseconds"))


