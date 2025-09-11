from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import EventFeatureAccess
from .utils import clear_feature_access_cache


@receiver(post_save, sender=EventFeatureAccess)
def clear_cache_on_feature_access_save(sender, instance, **kwargs):
    """Clear feature access cache when EventFeatureAccess is saved."""
    clear_feature_access_cache(instance.event, instance.feature.name)


@receiver(post_delete, sender=EventFeatureAccess)
def clear_cache_on_feature_access_delete(sender, instance, **kwargs):
    """Clear feature access cache when EventFeatureAccess is deleted."""
    clear_feature_access_cache(instance.event, instance.feature.name)
