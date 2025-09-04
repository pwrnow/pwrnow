"""
Django signals for cache invalidation and translation tasks.

Automatically invalidates relevant caches when models are created, updated, or deleted.
Also triggers automatic translation tasks for events.
"""
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Event, Category, Tag, PostImage, Post
from .cache import invalidate_events_cache, invalidate_categories_cache
from .tasks import translate_event_content, detect_event_image_aspect_ratio, detect_post_image_aspect_ratio


@receiver(post_save, sender=Event)
def event_post_save_handler(sender, instance, created, **kwargs):
    """
    Handle Event post-save actions:
    1. Invalidate events cache when an Event is created or updated
    2. Trigger translation task for new events
    3. Trigger aspect ratio detection task for events with images

    Args:
        sender: The Event model class
        instance: The Event instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    # Always invalidate cache
    invalidate_events_cache()
    print(f"🔍 Event post-save signal received for event {instance.id}")

    # Only trigger translation task for newly created events
    if created:
        # Start translation task immediately in background
        translate_event_content.delay(str(instance.id))

    # Trigger aspect ratio detection if event has an image and aspect_ratio is not set
    if instance.image and not instance.aspect_ratio:
        # Start aspect ratio detection task immediately in background
        detect_event_image_aspect_ratio.delay(str(instance.id))


@receiver(post_delete, sender=Event)
def invalidate_events_on_delete(sender, instance, **kwargs):
    """
    Invalidate events cache when an Event is deleted.

    Args:
        sender: The Event model class
        instance: The Event instance being deleted
        **kwargs: Additional signal arguments
    """
    invalidate_events_cache()


@receiver(m2m_changed, sender=Event.tags.through)
def invalidate_events_on_tags_change(sender, instance, action, **kwargs):
    """
    Invalidate events cache when Event tags are modified.

    Args:
        sender: The through model for Event.tags
        instance: The Event instance
        action: The type of change (e.g., 'post_add', 'post_remove', 'post_clear')
        **kwargs: Additional signal arguments
    """
    # Only invalidate cache after changes are completed
    if action in ['post_add', 'post_remove', 'post_clear']:
        invalidate_events_cache()


@receiver(post_save, sender=Category)
def invalidate_categories_on_save(sender, instance, created, **kwargs):
    """
    Invalidate categories cache when a Category is created or updated.

    Also invalidates events cache since events include category data.

    Args:
        sender: The Category model class
        instance: The Category instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    invalidate_categories_cache()
    # Categories are included in event serialization, so invalidate events too
    invalidate_events_cache()


@receiver(post_delete, sender=Category)
def invalidate_categories_on_delete(sender, instance, **kwargs):
    """
    Invalidate categories cache when a Category is deleted.

    Also invalidates events cache since events include category data.

    Args:
        sender: The Category model class
        instance: The Category instance being deleted
        **kwargs: Additional signal arguments
    """
    invalidate_categories_cache()
    # Categories are included in event serialization, so invalidate events too
    invalidate_events_cache()


@receiver(post_save, sender=Tag)
def invalidate_events_on_tag_save(sender, instance, created, **kwargs):
    """
    Invalidate events cache when a Tag is created or updated.

    Since tags can be associated with events, we need to invalidate events cache.

    Args:
        sender: The Tag model class
        instance: The Tag instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    # Only invalidate if the tag is actually used by events
    if instance.events.exists():
        invalidate_events_cache()


@receiver(post_delete, sender=Tag)
def invalidate_events_on_tag_delete(sender, instance, **kwargs):
    """
    Invalidate events cache when a Tag is deleted.

    Args:
        sender: The Tag model class
        instance: The Tag instance being deleted
        **kwargs: Additional signal arguments
    """
    # Tag deletion will automatically remove relationships, affecting events
    invalidate_events_cache()


@receiver(post_save, sender=PostImage)
def post_image_post_save_handler(sender, instance, created, **kwargs):
    """
    Handle PostImage post-save actions:
    1. Trigger aspect ratio detection for new post images with images

    Args:
        sender: The PostImage model class
        instance: The PostImage instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    # Trigger aspect ratio detection if post image has an image and aspect_ratio is not set
    if instance.image and not instance.aspect_ratio:
        # Start aspect ratio detection task immediately in background
        detect_post_image_aspect_ratio.delay(str(instance.id))


@receiver(post_save, sender=Post)
def post_post_save_handler(sender, instance, created, **kwargs):
    """
    Handle Post post-save actions:
    1. Trigger post verification notifications when a post is verified

    Args:
        sender: The Post model class
        instance: The Post instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    # Check if post was just verified
    if instance.verified:
                # For new posts, check if they were created as verified
        if created and instance.verified:
            # New post created as verified
            from notifications.tasks import send_post_verification_notifications
            send_post_verification_notifications.delay(str(instance.id))
            print(f"🔔 New verified post {instance.id}, triggering notifications")
        elif not created:
            # Existing post was updated to verified
            # Check if verified_at was just set (indicating recent verification)
            if (instance.verified_at and
                instance.verified_at > timezone.now() - timedelta(minutes=1)):
                # Post was just verified, trigger notification task
                from notifications.tasks import send_post_verification_notifications
                send_post_verification_notifications.delay(str(instance.id))
                print(f"🔔 Post verification signal received for post {instance.id}, triggering notifications")