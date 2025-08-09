from rest_framework import serializers
from django.conf import settings
from .models import Device, PushNotification


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for device registration and management."""

    preferred_language = serializers.ChoiceField(
        choices=[code for code, _ in getattr(__import__('django.conf').conf.settings, 'LANGUAGES', [('pl','Polish'),('en','English')])],
        required=False
    )

    class Meta:
        model = Device
        fields = [
            'id',
            'expo_push_token',
            'platform',
            'device_name',
            'app_version',
            'notifications_enabled',
            'preferred_language',
            'created_at',
            'updated_at',
            'last_active_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_active_at']


class DeviceRegistrationSerializer(serializers.Serializer):
    """Serializer for registering/updating a device from mobile app input (camelCase)."""

    expoPushToken = serializers.CharField(max_length=200)
    platform = serializers.ChoiceField(choices=['ios', 'android'])
    deviceName = serializers.CharField(max_length=100, allow_blank=True, required=False)
    appVersion = serializers.CharField(max_length=20, allow_blank=True, required=False)
    notificationsEnabled = serializers.BooleanField(required=False, default=True)
    preferredLanguage = serializers.CharField(max_length=10, required=False, allow_blank=True)

    def validate_expoPushToken(self, value: str) -> str:
        if not (value.startswith('ExponentPushToken[') or value.startswith('ExpoPushToken[')):
            raise serializers.ValidationError('Invalid Expo push token format')
        return value

    def validate_preferredLanguage(self, value: str) -> str:
        if not value:
            return settings.LANGUAGE_CODE
        raw_lang = value.lower()
        normalized_lang = raw_lang.split('-')[0]
        supported = [code for code, _ in settings.LANGUAGES]
        return normalized_lang if normalized_lang in supported else settings.LANGUAGE_CODE


class PushNotificationSerializer(serializers.ModelSerializer):
    """Serializer for push notification records."""

    device_name = serializers.CharField(source='device.device_name', read_only=True)

    class Meta:
        model = PushNotification
        fields = [
            'id',
            'title',
            'body',
            'data',
            'status',
            'error_message',
            'created_at',
            'sent_at',
            'delivered_at',
            'device_name',
        ]
        read_only_fields = ['id', 'created_at', 'sent_at', 'delivered_at']