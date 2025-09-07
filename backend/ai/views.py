from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.translation import gettext_lazy as _
from core.authentication import get_current_organization
from core.serializers import ScheduleSerializer
from .serializers import ScheduleParseRequestSerializer
from .services import ScheduleParsingService
from .throttles import OrganizationRateThrottle
from feature_access.utils import has_feature_access
import logging
import time
from django.core.cache import cache

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([OrganizationRateThrottle])
def parse_schedule(request):
    """
    Parse raw schedule text using AI.

    This endpoint accepts raw schedule text (from Excel, text documents, etc.)
    and uses AI to extract and format it into structured schedule items.
    """
    # Check organization authentication
    current_org = get_current_organization(request)
    if not current_org:
        return Response(
            {'error': _('Organization authentication required.')},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if organization has access to magic parsing feature
    if not has_feature_access(current_org, 'magic_parsing'):
        return Response(
            {'error': _('Magic parsing feature is not available for your organization.')},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ScheduleParseRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create parsing service and process (configuration is hardcoded)
        parsing_service = ScheduleParsingService()
        result = parsing_service.parse_schedule(
            raw_text=serializer.validated_data['raw_text'],
            organization=current_org,
            user=request.user if request.user.is_authenticated else None,
            event_title=serializer.validated_data.get('event_title'),
            event_start_date=serializer.validated_data.get('event_start_date'),
            event_end_date=serializer.validated_data.get('event_end_date')
        )

        if not result['success']:
            return Response(
                {'error': result.get('error', 'Failed to parse schedule')},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a mock schedule object with the parsed items
        from datetime import date, time

        # Create a temporary schedule object for serialization
        mock_schedule = type('MockSchedule', (), {
            'id': 'temp-schedule-id',
            'items': []
        })()

        # Convert parsed items to ScheduleItem-like objects
        for item_data in result['schedule_items']:
            mock_item = type('MockScheduleItem', (), {
                'id': f"temp-item-{len(mock_schedule.items)}",
                'date': date.fromisoformat(item_data['date']),
                'start_time': time.fromisoformat(item_data['start_time']),
                'end_time': time.fromisoformat(item_data['end_time']),
                'title': item_data['title'],
                'description': item_data.get('description', ''),
                'duration_minutes': 0  # Will be calculated by serializer
            })()
            mock_schedule.items.append(mock_item)

        # Serialize the schedule
        schedule_serializer = ScheduleSerializer(mock_schedule, context={'request': request})
        return Response(schedule_serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Schedule parsing error: {str(e)}")
        return Response(
            {'error': _('Failed to parse schedule. Please try again or contact support.')},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def parse_schedule_availability(request):
    """
    Returns whether the current organization can use AI parse now,
    remaining requests in the current window, total limit, and retry-after seconds.
    This does not consume a request.
    """
    current_org = get_current_organization(request)
    if not current_org:
        return Response(
            {'error': _('Organization authentication required.')},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Check if organization has access to magic parsing feature
    if not has_feature_access(current_org, 'magic_parsing'):
        return Response(
            {'error': _('Magic parsing feature is not available for your organization.')},
            status=status.HTTP_403_FORBIDDEN
        )

    throttle = OrganizationRateThrottle()
    cache_key = throttle.get_cache_key(request, None)
    if cache_key is None:
        return Response(
            {'error': _('Organization authentication required.')},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Load history from cache without mutating it
    history = cache.get(cache_key, [])

    # Parse rate "N/period"
    rate = throttle.get_rate()
    num_requests, duration = throttle.parse_rate(rate) if rate else (None, None)

    # If no rate configured, treat as unlimited
    if not rate or num_requests is None or duration is None:
        return Response({
            'available': True,
            'remaining': 999999,
            'limit': 0,
            'retry_after_seconds': 0,
        })

    now = time.time()
    # Prune outdated entries
    recent_history = [ts for ts in history if ts > now - duration]
    remaining = max(0, num_requests - len(recent_history))
    available = remaining > 0

    retry_after_seconds = 0
    if not available and recent_history:
        oldest_within_window = recent_history[-1]
        wait = int(duration - (now - oldest_within_window))
        retry_after_seconds = max(0, wait)

    return Response({
        'available': available,
        'remaining': remaining if available else 0,
        'limit': num_requests,
        'retry_after_seconds': retry_after_seconds,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_feature_access(request):
    """
    Check if the current organization has access to specific features.
    Returns a dictionary of feature names and their access status.
    """
    current_org = get_current_organization(request)
    if not current_org:
        return Response(
            {'error': _('Organization authentication required.')},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Get requested features from query parameters
    requested_features = request.GET.getlist('features', [])
    
    # If no features specified, return all available features
    if not requested_features:
        from feature_access.utils import get_organization_features
        available_features = get_organization_features(current_org)
        return Response({
            'features': {
                'magic_parsing': 'magic_parsing' in available_features
            }
        })
    
    # Check specific features
    feature_access = {}
    for feature_name in requested_features:
        feature_access[feature_name] = has_feature_access(current_org, feature_name)
    
    return Response({
        'features': feature_access
    }, status=status.HTTP_200_OK)