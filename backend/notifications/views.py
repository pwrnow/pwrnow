from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import Device
from .serializers import DeviceSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_device(request):
    """Register or update a device for push notifications."""

    expo_push_token = request.data.get('expoPushToken')
    if not expo_push_token:
        return Response(
            {'error': 'expoPushToken is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate token format
    if not expo_push_token.startswith('ExponentPushToken[') and not expo_push_token.startswith('ExpoPushToken['):
        return Response(
            {'error': 'Invalid Expo push token format'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create device
    device, created = Device.objects.get_or_create(
        expo_push_token=expo_push_token,
        defaults={
            'platform': request.data.get('platform', 'ios'),
            'device_name': request.data.get('deviceName', ''),
            'app_version': request.data.get('appVersion', ''),
            'notifications_enabled': request.data.get('notificationsEnabled', True),
        }
    )

    # If device exists, update basic info and last_active_at
    if not created:
        device.platform = request.data.get('platform', device.platform)
        device.device_name = request.data.get('deviceName', device.device_name)
        device.app_version = request.data.get('appVersion', device.app_version)
        if 'notificationsEnabled' in request.data:
            device.notifications_enabled = request.data['notificationsEnabled']

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