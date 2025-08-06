import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Event
from .services import push_service

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Event)
def event_verification_notification(sender, instance, created, **kwargs):
    """Send push notification when an event is initially verified."""

    # Skip if this is a new event creation
    if created:
        return

    # Only send notification if event just got verified
    if instance.verified and instance.verified_at:
        # Check if this is the initial verification (not a re-verification)
        # We can do this by checking if verified_at is very recent (within last few seconds)
        from django.utils import timezone
        import datetime

        # If verified_at is within the last 10 seconds, consider it a new verification
        ten_seconds_ago = timezone.now() - datetime.timedelta(seconds=10)

        if instance.verified_at >= ten_seconds_ago:
            logger.info(f"Event {instance.id} ({instance.title}) was just verified, sending push notifications")

            try:
                # Send notifications asynchronously to avoid blocking the save operation
                from .tasks import send_event_verification_notifications
                send_event_verification_notifications.delay(str(instance.id))
            except ImportError:
                # If Celery is not available, send synchronously
                logger.warning("Celery not available, sending notifications synchronously")
                push_service.send_event_verification_notification(instance)