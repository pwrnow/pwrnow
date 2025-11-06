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
from utils.logging_mixins import log_api_call
import logging
from utils.logging import bind_context
import time
from django.core.cache import cache

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([OrganizationRateThrottle])
@log_api_call("ai.parse_schedule")
def parse_schedule(request):
    """
    Parse raw schedule text using AI.

    This endpoint accepts raw schedule text (from Excel, text documents, etc.)
    and uses AI to extract and format it into structured schedule items.
    """
    ctx = bind_context(
        user_id=getattr(getattr(request, "user", None), "id", None),
        organization_id=getattr(get_current_organization(request), "id", None),
        endpoint="ai.parse_schedule",
    )

    logger.info("AI_PARSE_SCHEDULE_REQUEST_RECEIVED", **ctx)

    # Get event slug from request data
    event_slug = request.data.get("event_slug")
    if not event_slug:
        logger.warning("AI_PARSE_SCHEDULE_VALIDATION_ERROR missing event_slug", **ctx)
        return Response(
            {"error": _("Event slug is required.")}, status=status.HTTP_400_BAD_REQUEST
        )

    logger.debug(f"AI_PARSE_SCHEDULE_EVENT_LOOKUP event_slug={event_slug}", **ctx)

    # Get the event
    try:
        from core.models import Event

        event = Event.objects.get(slug=event_slug)
        logger.debug(f"AI_PARSE_SCHEDULE_EVENT_FOUND event_id={event.id}", **ctx)
    except Event.DoesNotExist:
        logger.warning(f"AI_PARSE_SCHEDULE_EVENT_NOT_FOUND event_slug={event_slug}", **ctx)
        return Response(
            {"error": _("Event not found.")}, status=status.HTTP_404_NOT_FOUND
        )

    # Check if event has access to magic parsing feature
    if not has_feature_access(event, "magic_parsing"):
        logger.info(f"AI_PARSE_SCHEDULE_FEATURE_DENIED event_id={event.id}", **ctx)
        return Response(
            {"error": _("Magic parsing feature is not available for this event.")},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Ensure scope aligns with settings.DEFAULT_THROTTLE_RATES['ai_parse']
    parse_schedule.throttle_scope = 'ai_parse'
    serializer = ScheduleParseRequestSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"AI_PARSE_SCHEDULE_SCHEMA_ERRORS {serializer.errors}", **ctx)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Create parsing service and process (configuration is hardcoded)
        logger.debug(f"AI_PARSE_SCHEDULE_PARSING_START event_id={event.id}", **ctx)
        parsing_service = ScheduleParsingService()
        result = parsing_service.parse_schedule(
            raw_text=serializer.validated_data["raw_text"],
            organization=event.organization,
            user=request.user if request.user.is_authenticated else None,
            event_title=event.title,
            event_start_date=event.starts_at.date().isoformat(),
            event_end_date=event.ends_at.date().isoformat(),
        )

        if not result["success"]:
            logger.error(f"AI_PARSE_SCHEDULE_FAILED event_id={event.id} error={result.get('error')}", **ctx)
            return Response(
                {"error": result.get("error", "Failed to parse schedule")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Return the parsed items directly in the expected format
        # Calculate duration for each item
        from datetime import datetime, timedelta

        formatted_items = []
        for i, item_data in enumerate(result["schedule_items"]):
            # Calculate duration in minutes
            start_time_str = item_data["start_time"]
            end_time_str = item_data["end_time"]

            # Handle 24:00 format (convert to 00:00 next day)
            if end_time_str == "24:00":
                end_time_str = "00:00"
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
                end_datetime = datetime.combine(datetime.today(), end_time) + timedelta(
                    days=1
                )
            else:
                end_time = datetime.strptime(end_time_str, "%H:%M").time()
                end_datetime = datetime.combine(datetime.today(), end_time)

            start_time = datetime.strptime(start_time_str, "%H:%M").time()
            start_datetime = datetime.combine(datetime.today(), start_time)

            duration_minutes = int((end_datetime - start_datetime).total_seconds() / 60)

            formatted_item = {
                "id": f"temp-item-{i}",
                "date": item_data["date"],
                "start_time": item_data["start_time"],
                "end_time": end_time_str,  # Use the processed end_time_str
                "title": item_data["title"],
                "description": item_data.get("description", ""),
                "duration_minutes": duration_minutes,
            }
            formatted_items.append(formatted_item)

        # Return in the expected format
        response_data = {"id": "temp-schedule-id", "items": formatted_items}
        logger.info(
            f"AI_PARSE_SCHEDULE_SUCCESS event_id={event.id} items={len(formatted_items)} tokens={result.get('tokens_used', 0)}",
            **ctx,
        )
        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"AI_PARSE_SCHEDULE_EXCEPTION event_id={event.id if 'event' in locals() else 'unknown'} error={str(e)}", **ctx, exc_info=True)
        return Response(
            {
                "error": _(
                    "Failed to parse schedule. Please try again or contact support."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
@log_api_call("ai.parse_schedule_availability")
def parse_schedule_availability(request):
    """
    Returns whether the current event can use AI parse now,
    remaining requests in the current window, total limit, and retry-after seconds.
    This does not consume a request.
    """
    logger.debug("AI_PARSE_SCHEDULE_AVAILABILITY_CHECK")
    # Get event slug from query parameters
    event_slug = request.GET.get("event_slug")
    if not event_slug:
        logger.warning("AI_PARSE_SCHEDULE_AVAILABILITY_NO_SLUG")
        return Response(
            {"error": _("Event slug is required.")},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get the event
    try:
        from core.models import Event

        event = Event.objects.get(slug=event_slug)
        logger.debug(f"AI_PARSE_SCHEDULE_AVAILABILITY_EVENT_FOUND event_id={event.id}")
    except Event.DoesNotExist:
        logger.warning(f"AI_PARSE_SCHEDULE_AVAILABILITY_EVENT_NOT_FOUND event_slug={event_slug}")
        return Response(
            {"error": _("Event not found.")},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check if event has access to magic parsing feature
    if not has_feature_access(event, "magic_parsing"):
        logger.info(f"AI_PARSE_SCHEDULE_AVAILABILITY_FEATURE_DENIED event_id={event.id}")
        return Response(
            {"error": _("Magic parsing feature is not available for this event.")},
            status=status.HTTP_403_FORBIDDEN,
        )

    # For now, return unlimited availability for events
    # TODO: Implement event-based rate limiting if needed
    logger.debug(f"AI_PARSE_SCHEDULE_AVAILABILITY_SUCCESS event_id={event.id}")
    return Response(
        {
            "available": True,
            "remaining": 999999,
            "limit": 0,
            "retry_after_seconds": 0,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
@log_api_call("ai.check_feature_access")
def check_feature_access(request):
    """
    Check if a specific event has access to specific features.
    Returns a dictionary of feature names and their access status.
    """
    logger.debug("AI_CHECK_FEATURE_ACCESS_REQUEST")
    # Get event slug from query parameters
    event_slug = request.GET.get("event_slug")
    if not event_slug:
        logger.warning("AI_CHECK_FEATURE_ACCESS_NO_SLUG")
        return Response(
            {"error": _("Event slug is required.")}, status=status.HTTP_400_BAD_REQUEST
        )

    # Get the event
    try:
        from core.models import Event

        event = Event.objects.get(slug=event_slug)
        logger.debug(f"AI_CHECK_FEATURE_ACCESS_EVENT_FOUND event_id={event.id}")
    except Event.DoesNotExist:
        logger.warning(f"AI_CHECK_FEATURE_ACCESS_EVENT_NOT_FOUND event_slug={event_slug}")
        return Response(
            {"error": _("Event not found.")}, status=status.HTTP_404_NOT_FOUND
        )

    # Get requested features from query parameters
    requested_features = request.GET.getlist("features", [])

    # If no features specified, return all available features
    if not requested_features:
        logger.debug(f"AI_CHECK_FEATURE_ACCESS_ALL_FEATURES event_id={event.id}")
        from feature_access.utils import get_event_features

        available_features = get_event_features(event)
        logger.info(f"AI_CHECK_FEATURE_ACCESS_SUCCESS event_id={event.id} features={available_features}")
        return Response(
            {"features": {"magic_parsing": "magic_parsing" in available_features}}
        )

    # Check specific features
    logger.debug(f"AI_CHECK_FEATURE_ACCESS_SPECIFIC_FEATURES event_id={event.id} features={requested_features}")
    feature_access = {}
    for feature_name in requested_features:
        feature_access[feature_name] = has_feature_access(event, feature_name)

    logger.info(f"AI_CHECK_FEATURE_ACCESS_SUCCESS event_id={event.id} results={feature_access}")
    return Response({"features": feature_access}, status=status.HTTP_200_OK)
