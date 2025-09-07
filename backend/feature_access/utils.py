from django.core.cache import cache
from .models import Feature, OrganizationFeatureAccess


def has_feature_access(organization, feature_name):
    """
    Check if an organization has access to a specific feature.
    
    Args:
        organization: Organization instance or organization ID
        feature_name: String name of the feature to check
        
    Returns:
        bool: True if the organization has access to the feature, False otherwise
    """
    if not organization:
        return False
    
    # Handle both Organization instance and ID
    org_id = organization.id if hasattr(organization, 'id') else organization
    
    # Create cache key
    cache_key = f"feature_access:{org_id}:{feature_name}"
    
    # Try to get from cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    # Check database
    try:
        access = OrganizationFeatureAccess.objects.select_related('feature').get(
            organization_id=org_id,
            feature__name=feature_name,
            feature__is_active=True
        )
        has_access = access.is_enabled
        
        # Cache the result for 5 minutes
        cache.set(cache_key, has_access, 300)
        
        return has_access
    except OrganizationFeatureAccess.DoesNotExist:
        # Cache negative result for 1 minute (shorter to allow for new features)
        cache.set(cache_key, False, 60)
        return False


def get_organization_features(organization):
    """
    Get all features available to an organization.
    
    Args:
        organization: Organization instance or organization ID
        
    Returns:
        list: List of feature names that the organization has access to
    """
    if not organization:
        return []
    
    # Handle both Organization instance and ID
    org_id = organization.id if hasattr(organization, 'id') else organization
    
    # Create cache key
    cache_key = f"organization_features:{org_id}"
    
    # Try to get from cache first
    cached_result = cache.get(cache_key)
    if cached_result is not None:
        return cached_result
    
    # Query database
    features = list(
        OrganizationFeatureAccess.objects
        .filter(organization_id=org_id, is_enabled=True, feature__is_active=True)
        .values_list('feature__name', flat=True)
    )
    
    # Cache the result for 5 minutes
    cache.set(cache_key, features, 300)
    
    return features


def clear_feature_access_cache(organization=None, feature_name=None):
    """
    Clear feature access cache for an organization and/or feature.
    
    Args:
        organization: Organization instance or organization ID (optional)
        feature_name: Feature name (optional)
    """
    if organization:
        org_id = organization.id if hasattr(organization, 'id') else organization
        
        if feature_name:
            # Clear specific feature cache
            cache_key = f"feature_access:{org_id}:{feature_name}"
            cache.delete(cache_key)
        else:
            # Clear all feature caches for this organization
            # Get all features for this org and clear their caches
            features = OrganizationFeatureAccess.objects.filter(
                organization_id=org_id
            ).values_list('feature__name', flat=True)
            
            for feature in features:
                cache_key = f"feature_access:{org_id}:{feature}"
                cache.delete(cache_key)
            
            # Also clear the organization features cache
            cache_key = f"organization_features:{org_id}"
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
            'display_name': display_name,
            'description': description,
            'is_active': True
        }
    )
    return feature, created
