from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Device
from .serializers import DeviceSerializer, DeviceRegistrationSerializer
from django.conf import settings
import logging
from utils.logging import bind_context

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_device(request):
    """Register or update a device for push notifications."""
    ctx = bind_context(
        user_id=getattr(getattr(request, "user", None), "id", None),
        organization_id=None,
        endpoint="notifications.register_device",
    )
    logger.info("NOTIF_DEVICE_REGISTER_REQUEST", extra=ctx)
    serializer_in = DeviceRegistrationSerializer(data=request.data)
    if not serializer_in.is_valid():
        logger.warning(f"NOTIF_DEVICE_REGISTER_SCHEMA_ERRORS errors={serializer_in.errors}", extra=ctx)
        return Response(serializer_in.errors, status=status.HTTP_400_BAD_REQUEST)

    validated = serializer_in.validated_data
    expo_push_token = validated['expoPushToken']

    # Preferred language is validated/normalized by serializer
    normalized_lang = validated.get('preferredLanguage', settings.LANGUAGE_CODE)

    logger.debug(f"NOTIF_DEVICE_REGISTER_LOOKUP token={expo_push_token[:10]}...", extra=ctx)
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
        logger.debug(f"NOTIF_DEVICE_REGISTER_UPDATE device_id={device.id}", extra=ctx)
        device.platform = validated.get('platform', device.platform)
        device.device_name = validated.get('deviceName', device.device_name)
        device.app_version = validated.get('appVersion', device.app_version)
        if 'notificationsEnabled' in validated:
            device.notifications_enabled = validated['notificationsEnabled']
        if 'preferredLanguage' in validated:
            device.preferred_language = normalized_lang

    # Assign device to authenticated user if present
    if request.user and request.user.is_authenticated:
        if device.user != request.user:
            logger.debug(f"NOTIF_DEVICE_REGISTER_USER_ASSIGN device_id={device.id} user_id={request.user.id}", extra=ctx)
        device.user = request.user

    # Always update last_active_at
    device.last_active_at = timezone.now()
    device.save()

    logger.info(
        f"NOTIF_DEVICE_REGISTER_SUCCESS device_id={device.id} created={created} platform={device.platform} notifications_enabled={device.notifications_enabled}",
        extra=ctx,
    )



    serializer = DeviceSerializer(device)
    resp = Response(
        {
            'device': serializer.data,
            'created': created,
            'message': 'Device registered successfully' if created else 'Device updated successfully'
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )
    return resp