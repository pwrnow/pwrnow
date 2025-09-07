from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import OrganizationFeatureAccess
from .utils import clear_feature_access_cache


@receiver(post_save, sender=OrganizationFeatureAccess)
def clear_cache_on_feature_access_save(sender, instance, **kwargs):
    """Clear feature access cache when OrganizationFeatureAccess is saved."""
    clear_feature_access_cache(instance.organization, instance.feature.name)


@receiver(post_delete, sender=OrganizationFeatureAccess)
def clear_cache_on_feature_access_delete(sender, instance, **kwargs):
    """Clear feature access cache when OrganizationFeatureAccess is deleted."""
    clear_feature_access_cache(instance.organization, instance.feature.name)
