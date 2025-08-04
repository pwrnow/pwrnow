"""
Cache utilities for events and categories.

Provides production-ready caching for listing endpoints with proper invalidation.
"""
import hashlib
import json
import logging
from typing import Dict, List, Optional

from django.core.cache import cache
from django.conf import settings
from django.db.models import QuerySet
from django_redis import get_redis_connection

# Set up logger for this module
logger = logging.getLogger(__name__)


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


def get_categories_cache_key(**filters) -> str:
    """Get cache key for categories list with optional filters (like language)."""
    return get_cache_key(
        settings.CACHE_KEYS['CATEGORIES_LIST'],
        **filters
    )


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
    logger.debug("Checking cache for key: %s", cache_key)

    # Try to get from cache first
    cached_data = cache.get(cache_key)
    if cached_data is not None:
        logger.debug("Cache HIT: Found %d items in cache for key: %s", len(cached_data), cache_key)
        return cached_data

    logger.debug("Cache MISS: Fetching fresh data for key: %s", cache_key)

    # Serialize the queryset
    serializer = serializer_class(queryset, many=True, context=context or {})
    data = serializer.data

    logger.debug("Serialized: Got %d items from queryset", len(data))

    # Cache the serialized data
    cache.set(cache_key, data, timeout)
    logger.debug("Cache SET: Stored %d items with timeout %ss for key: %s", len(data), timeout, cache_key)

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
    logger.debug("EVENTS: Caching public events with filters: %s", filters)
    cache_key = get_public_events_cache_key(**filters)
    timeout = settings.CACHE_TTL['PUBLIC_EVENTS']
    logger.debug("EVENTS: Using cache key: %s, timeout: %ss", cache_key, timeout)

    return cache_queryset_data(cache_key, queryset, serializer_class, context, timeout)


def cache_categories(queryset: QuerySet, serializer_class, context: Optional[Dict] = None, **filters) -> List[Dict]:
    """
    Cache categories list with optional filters (like language).

    Args:
        queryset: Categories queryset to cache
        serializer_class: Category serializer class
        context: Optional context for serializer
        **filters: Optional filters to include in cache key

    Returns:
        Cached or fresh serialized categories data
    """
    logger.debug("CATEGORIES: Caching categories list with filters: %s", filters)
    cache_key = get_categories_cache_key(**filters)
    timeout = settings.CACHE_TTL['CATEGORIES']
    logger.debug("CATEGORIES: Using cache key: %s, timeout: %ss", cache_key, timeout)

    return cache_queryset_data(cache_key, queryset, serializer_class, context, timeout)


def invalidate_events_cache():
    """
    Invalidate all cached events data.

    Uses redis pattern matching to delete all event-related cache keys.
    """
    logger.info("INVALIDATE: Starting events cache invalidation")
    try:
        redis_client = get_redis_connection("default")

        # Get all keys matching the events pattern
        base_key = settings.CACHE_KEYS['PUBLIC_EVENTS_LIST']
        key_prefix = settings.CACHES['default'].get('KEY_PREFIX', '')

        if key_prefix:
            pattern = f"{key_prefix}:*{base_key}*"
        else:
            pattern = f"*{base_key}*"

        logger.debug("INVALIDATE: Searching for keys with pattern: %s", pattern)
        keys = redis_client.keys(pattern)
        logger.debug("INVALIDATE: Found %d keys to delete", len(keys))

        if keys:
            redis_client.delete(*keys)
            logger.info("INVALIDATE: Successfully deleted %d events cache keys", len(keys))
        else:
            logger.debug("INVALIDATE: No events cache keys found to delete")

    except Exception as e:
        logger.error("INVALIDATE ERROR: Redis pattern matching failed: %s", e)
        # Fall back to clearing the base cache key if pattern matching fails
        cache.delete(settings.CACHE_KEYS['PUBLIC_EVENTS_LIST'])
        logger.warning("INVALIDATE: Fallback - deleted base events cache key")


def invalidate_categories_cache():
    """
    Invalidate all categories cache (all languages).
    """
    logger.info("INVALIDATE: Starting categories cache invalidation")
    try:
        redis_client = get_redis_connection("default")

        # Get all keys matching the categories pattern
        base_key = settings.CACHE_KEYS['CATEGORIES_LIST']
        key_prefix = settings.CACHES['default'].get('KEY_PREFIX', '')

        if key_prefix:
            pattern = f"{key_prefix}:*{base_key}*"
        else:
            pattern = f"*{base_key}*"

        logger.debug("INVALIDATE: Searching for categories keys with pattern: %s", pattern)
        keys = redis_client.keys(pattern)
        logger.debug("INVALIDATE: Found %d categories keys to delete", len(keys))

        if keys:
            redis_client.delete(*keys)
            logger.info("INVALIDATE: Successfully deleted %d categories cache keys", len(keys))
        else:
            logger.debug("INVALIDATE: No categories cache keys found to delete")

    except Exception as e:
        logger.error("INVALIDATE ERROR: Redis pattern matching failed: %s", e)
        # Fall back to clearing the base cache key if pattern matching fails
        cache.delete(settings.CACHE_KEYS['CATEGORIES_LIST'])
        logger.warning("INVALIDATE: Fallback - deleted base categories cache key")


def invalidate_all_cache():
    """
    Invalidate both events and categories cache.
    """
    logger.info("INVALIDATE: Starting full cache invalidation")
    invalidate_events_cache()
    invalidate_categories_cache()
    logger.info("INVALIDATE: Full cache invalidation completed")