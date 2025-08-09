import logging
from celery import shared_task
from django.utils import timezone
from .models import Device, PushNotification
from .services import push_service
from core.models import Event

logger = logging.getLogger(__name__)


@shared_task
def send_event_verification_notifications(event_id):
    """Send push notifications for a newly verified event."""

    try:
        event = Event.objects.get(id=event_id)

        if not event.verified:
            logger.warning(f"Event {event_id} is not verified, skipping notifications")
            return

        count = push_service.send_event_verification_notification(event)
        logger.info(f"Sent {count} notifications for verified event {event.title}")

        return count

    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        return 0
    except Exception as e:
        logger.error(f"Error sending notifications for event {event_id}: {str(e)}")
        return 0


@shared_task
def update_notification_delivery_status():
    """Periodically update delivery status of sent notifications."""

    try:
        push_service.update_delivery_status()
        logger.info("Updated notification delivery status")
    except Exception as e:
        logger.error(f"Error updating delivery status: {str(e)}")


@shared_task
def cleanup_old_notifications():
    """Clean up old notification records (older than 90 days)."""

    try:
        ninety_days_ago = timezone.now() - timezone.timedelta(days=90)
        deleted_count = PushNotification.objects.filter(
            created_at__lt=ninety_days_ago
        ).delete()[0]

        logger.info(f"Cleaned up {deleted_count} old notifications")
        return deleted_count

    except Exception as e:
        logger.error(f"Error cleaning up notifications: {str(e)}")
        return 0


@shared_task
def cleanup_inactive_devices():
    """Clean up devices that haven't been active for more than 90 days."""

    try:
        ninety_days_ago = timezone.now() - timezone.timedelta(days=90)
        deleted_count = Device.objects.filter(
            last_active_at__lt=ninety_days_ago
        ).delete()[0]

        logger.info(f"Cleaned up {deleted_count} inactive devices")
        return deleted_count

    except Exception as e:
        logger.error(f"Error cleaning up devices: {str(e)}")
        return 0


@shared_task
def send_test_notification(device_id, title="Test Notification", body="This is a test notification"):
    """Send a test notification to a specific device."""

    try:
        device = Device.objects.get(id=device_id)

        # Try to attach latest valid event data for deep linking tests
        event = (
            Event.objects
            .filter(verified=True, ends_at__gte=timezone.now())
            .order_by('-verified_at', 'starts_at')
            .first()
        )

        data = {
            'type': 'test',
            'timestamp': timezone.now().isoformat(),
        }

        if event:
            data.update({
                'event_id': str(event.id),
                'event_slug': event.slug,
                'category_slug': event.category.slug if event.category else None,
                'organization_slug': event.organization.slug if event.organization else None,
            })

        success = push_service.send_notification_to_device(
            device=device,
            title=title,
            body=body,
            data=data
        )

        if success:
            logger.info(f"Test notification sent to device {device_id}")
        else:
            logger.warning(f"Failed to send test notification to device {device_id}")

        return success

    except Device.DoesNotExist:
        logger.error(f"Device {device_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error sending test notification: {str(e)}")
        return False