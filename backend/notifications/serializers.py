from rest_framework import serializers
from .models import Device, PushNotification


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for device registration and management."""

    class Meta:
        model = Device
        fields = [
            'id',
            'expo_push_token',
            'platform',
            'device_name',
            'app_version',
            'notifications_enabled',
            'created_at',
            'updated_at',
            'last_active_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_active_at']


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