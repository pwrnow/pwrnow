"""
Cache utilities for events and categories.

Provides production-ready caching for listing endpoints with proper invalidation.
"""
import hashlib
import json
from typing import Any, Dict, List, Optional

from django.core.cache import cache
from django.conf import settings
from django.db.models import QuerySet
from django_redis import get_redis_connection


def get_cache_key(base_key: str, **params) -> str:
    """
    Generate a cache key with optional parameters for dynamic caching.

    Args:
        base_key: Base cache key from settings.CACHE_KEYS
        **params: Additional parameters to include in the cache key

    Returns:
        Full cache key with parameters hash
    """
    if not params:
        return base_key

    # Sort parameters for consistent cache keys
    sorted_params = sorted(params.items())
    params_str = json.dumps(sorted_params, sort_keys=True)
    params_hash = hashlib.md5(params_str.encode()).hexdigest()[:8]

    return f"{base_key}:{params_hash}"


def get_public_events_cache_key(**filters) -> str:
    """Get cache key for public events list with optional filters."""
    return get_cache_key(
        settings.CACHE_KEYS['PUBLIC_EVENTS_LIST'],
        **filters
    )


def get_categories_cache_key() -> str:
    """Get cache key for categories list."""
    return settings.CACHE_KEYS['CATEGORIES_LIST']


def cache_queryset_data(cache_key: str, queryset: QuerySet, serializer_class,
                       context: Optional[Dict] = None, timeout: Optional[int] = None) -> List[Dict]:
    """
    Cache queryset data using serializer.

    Args:
        cache_key: Cache key to use
        queryset: Django queryset to cache
        serializer_class: DRF serializer class to serialize data
        context: Optional context for serializer
        timeout: Cache timeout in seconds

    Returns:
        Serialized data list
    """
    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        print(f"📦 CACHE HIT: Using cached data for key: {cache_key}")
        return cached_data

    print(f"🔄 CACHE MISS: Fetching fresh data for key: {cache_key}")
    # Serialize the queryset
    serializer = serializer_class(queryset, many=True, context=context or {})
    data = serializer.data

    # Cache the serialized data
    cache.set(cache_key, data, timeout)
    print(f"💾 CACHE SET: Stored {len(data)} items with timeout {timeout}s for key: {cache_key}")

    return data


def cache_public_events(queryset: QuerySet, serializer_class, context: Optional[Dict] = None,
                       **filters) -> List[Dict]:
    """
    Cache public events list with optional filters.

    Args:
        queryset: Events queryset to cache
        serializer_class: Event serializer class
        context: Optional context for serializer
        **filters: Filters applied to the queryset

    Returns:
        Cached or fresh serialized events data
    """
    print(f"📅 EVENTS: Checking cache for public events list (filters: {filters})...")
    cache_key = get_public_events_cache_key(**filters)
    timeout = settings.CACHE_TTL['PUBLIC_EVENTS']

    return cache_queryset_data(cache_key, queryset, serializer_class, context, timeout)


def cache_categories(queryset: QuerySet, serializer_class, context: Optional[Dict] = None) -> List[Dict]:
    """
    Cache categories list.

    Args:
        queryset: Categories queryset to cache
        serializer_class: Category serializer class
        context: Optional context for serializer

    Returns:
        Cached or fresh serialized categories data
    """
    print("🏷️  CATEGORIES: Checking cache for categories list...")
    cache_key = get_categories_cache_key()
    timeout = settings.CACHE_TTL['CATEGORIES']

    return cache_queryset_data(cache_key, queryset, serializer_class, context, timeout)


def invalidate_events_cache():
    """
    Invalidate all cached events data.

    Uses redis pattern matching to delete all event-related cache keys.
    """
    try:
        redis_client = get_redis_connection("default")

        # Get all keys matching the events pattern
        pattern = f"{settings.CACHES['default']['KEY_PREFIX']}:*{settings.CACHE_KEYS['PUBLIC_EVENTS_LIST']}*"
        keys = redis_client.keys(pattern)

        if keys:
            redis_client.delete(*keys)

    except Exception as e:
        # Fall back to clearing the base cache key if pattern matching fails
        cache.delete(settings.CACHE_KEYS['PUBLIC_EVENTS_LIST'])


def invalidate_categories_cache():
    """
    Invalidate categories cache.
    """
    cache.delete(get_categories_cache_key())


def invalidate_all_cache():
    """
    Invalidate both events and categories cache.
    """
    invalidate_events_cache()
    invalidate_categories_cache()


