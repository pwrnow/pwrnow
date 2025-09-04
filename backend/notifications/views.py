from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Device
from .serializers import DeviceSerializer, DeviceRegistrationSerializer
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def register_device(request):
    """Register or update a device for push notifications."""

    serializer_in = DeviceRegistrationSerializer(data=request.data)
    if not serializer_in.is_valid():
        return Response(serializer_in.errors, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer_in.validated_data
    expo_push_token = validated['expoPushToken']

    # Preferred language is validated/normalized by serializer
    normalized_lang = validated.get('preferredLanguage', settings.LANGUAGE_CODE)

    # Get or create device
    device, created = Device.objects.get_or_create(
        expo_push_token=expo_push_token,
        defaults={
            'platform': validated.get('platform', 'ios'),
            'device_name': validated.get('deviceName') or '',
            'app_version': validated.get('appVersion') or '',
            'notifications_enabled': validated.get('notificationsEnabled', True),
            'preferred_language': normalized_lang,
        }
    )

    # If device exists, update basic info and last_active_at
    if not created:
        device.platform = validated.get('platform', device.platform)
        device.device_name = validated.get('deviceName', device.device_name)
        device.app_version = validated.get('appVersion', device.app_version)
        if 'notificationsEnabled' in validated:
            device.notifications_enabled = validated['notificationsEnabled']
        if 'preferredLanguage' in validated:
            device.preferred_language = normalized_lang

    # Assign device to authenticated user if present
    if request.user and request.user.is_authenticated:
        device.user = request.user

    # Always update last_active_at
    device.last_active_at = timezone.now()
    device.save()



    serializer = DeviceSerializer(device)
    return Response(
        {
            'device': serializer.data,
            'created': created,
            'message': 'Device registered successfully' if created else 'Device updated successfully'
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )