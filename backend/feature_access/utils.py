from django.core.cache import cache
from .models import Feature, EventFeatureAccess


def has_feature_access(event, feature_name):
    """
    Check if an event has access to a specific feature.

    Args:
        event: Event instance or event ID
        feature_name: String name of the feature to check

    Returns:
        bool: True if the event has access to the feature, False otherwise
    """
    if not event:
        return False

    # Handle both Event instance and ID
    event_id = event.id if hasattr(event, "id") else event

    # Create cache key
    cache_key = f"feature_access:{event_id}:{feature_name}"

    # Try to get from cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    # Check database
    try:
        access = EventFeatureAccess.objects.select_related("feature").get(
            event_id=event_id, feature__name=feature_name, feature__is_active=True
        )
        has_access = access.is_enabled

        # Cache the result for 5 minutes
        cache.set(cache_key, has_access, 300)

        return has_access
    except EventFeatureAccess.DoesNotExist:
        # Cache negative result for 1 minute (shorter to allow for new features)
        cache.set(cache_key, False, 60)
        return False


def get_event_features(event):
    """
    Get all features available to an event.

    Args:
        event: Event instance or event ID

    Returns:
        list: List of feature names that the event has access to
    """
    if not event:
        return []

    # Handle both Event instance and ID
    event_id = event.id if hasattr(event, "id") else event

    # Create cache key
    cache_key = f"event_features:{event_id}"

    # Try to get from cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result

    # Query database
    features = list(
        EventFeatureAccess.objects.filter(
            event_id=event_id, is_enabled=True, feature__is_active=True
        ).values_list("feature__name", flat=True)
    )

    # Cache the result for 5 minutes
    cache.set(cache_key, features, 300)

    return features


def clear_feature_access_cache(event=None, feature_name=None):
    """
    Clear feature access cache for an event and/or feature.

    Args:
        event: Event instance or event ID (optional)
        feature_name: Feature name (optional)
    """
    if event:
        event_id = event.id if hasattr(event, "id") else event

        if feature_name:
            # Clear specific feature cache
            cache_key = f"feature_access:{event_id}:{feature_name}"
            cache.delete(cache_key)
        else:
            # Clear all feature caches for this event
            # Get all features for this event and clear their caches
            features = EventFeatureAccess.objects.filter(event_id=event_id).values_list(
                "feature__name", flat=True
            )

            for feature in features:
                cache_key = f"feature_access:{event_id}:{feature}"
                cache.delete(cache_key)

            # Also clear the event features cache
            cache_key = f"event_features:{event_id}"
            cache.delete(cache_key)
    else:
        # Clear all feature access caches (use with caution)
        # This is a simple approach - in production you might want to use cache versioning
        cache.clear()


def ensure_feature_exists(feature_name, display_name, description=""):
    """
    Ensure a feature exists in the database. Create it if it doesn't exist.

    Args:
        feature_name: Internal name of the feature
        display_name: Human-readable name
        description: Feature description

    Returns:
        tuple: (Feature instance, created boolean)
    """
    feature, created = Feature.objects.get_or_create(
        name=feature_name,
        defaults={
            "display_name": display_name,
            "description": description,
            "is_active": True,
        },
    )
    return feature, created
