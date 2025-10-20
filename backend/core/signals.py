"""
Django signals for translation and notification tasks.

Triggers automatic translation tasks for events and notification tasks for posts.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Event, PostImage, Post, Organization, OrganizationCode
from .tasks import translate_event_content, detect_event_image_aspect_ratio, detect_post_image_aspect_ratio


@receiver(post_save, sender=Event)
def event_post_save_handler(sender, instance, created, **kwargs):
    """
    Handle Event post-save actions:
    1. Trigger translation task for new events
    2. Trigger aspect ratio detection task for events with images

    Args:
        sender: The Event model class
        instance: The Event instance being saved
        created: Boolean indicating if this is a new instance
        **kwargs: Additional signal arguments
    """
    print(f"🔍 Event post-save signal received for event {instance.id}")

    # Only trigger translation task for newly created events
    if created:
        # Start translation task immediately in background
        translate_event_content.delay(str(instance.id))

    # Trigger aspect ratio detection if event has an image and aspect_ratio is not set
    if instance.image and not instance.aspect_ratio:
        # Start aspect ratio detection task immediately in background
        detect_event_image_aspect_ratio.delay(str(instance.id))


@receiver(post_save, sender=Organization)
def organization_post_save_create_code(sender, instance, created, **kwargs):
    """
    Ensure a newly created organization automatically receives an auth code.

    This is idempotent on create: if somehow an organization already has codes,
    we do nothing. On true creation, we create exactly one code.
    """
    if not created:
        return

    if not instance.auth_codes.exists():
        OrganizationCode.objects.create(organization=instance)


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