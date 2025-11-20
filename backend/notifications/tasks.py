import logging
from celery import shared_task
from django.utils import timezone
from .models import Device, PushNotification
from .services import push_service
from core.models import Event

logger = logging.getLogger(__name__)





@shared_task
def update_notification_delivery_status():
    """Periodically update delivery status of sent notifications."""
    try:
        count = push_service.update_delivery_status()
        logger.info(f"Updated delivery status for {count} notifications")
        return count
    except Exception as e:
        logger.error(f"Error updating notification delivery status: {str(e)}")
        return 0


@shared_task
def send_daily_publication_notifications():
    """Send notifications for all events published today at 9 AM."""
    try:
        today = timezone.now().date()

        # Get all events published today that are verified
        events = Event.objects.filter(
            publication_date=today,
            verified=True
        ).select_related('organization', 'category')

        if not events.exists():
            logger.info(f"No events published today ({today})")
            return 0

        # Send all publication notifications in a single batch using the push service
        try:
            result = push_service.send_publication_notifications_for_events(events)
            total_sent = result['sent']
            total_failed = result['failed']

            logger.info(f"Batch publication notifications completed: {total_sent} sent, {total_failed} failed out of {result['total']} total")
            return total_sent

        except Exception as e:
            logger.error(f"Error sending batch publication notifications: {str(e)}")
            return 0

    except Exception as e:
        logger.error(f"Error in daily publication notifications task: {str(e)}")
        return 0


@shared_task
def send_event_reminder_24h():
    """Send reminders for events starting in ~24 hours.

    Window: events with starts_at between (now + 24h) and (now + 25h) to be resilient to scheduler drift.
    """
    try:
        now = timezone.now()
        start_window = now + timezone.timedelta(hours=24)
        end_window = now + timezone.timedelta(hours=25)

        events = (
            Event.objects
            .filter(
                verified=True,
                starts_at__gte=start_window,
                starts_at__lt=end_window,
                publication_date__lte=timezone.localdate()
            )
            .select_related('organization', 'category')
        )

        if not events.exists():
            logger.info("No events starting ~24h from now for reminders")
            return 0

        result = push_service.send_event_reminders_for_events(events)
        logger.info(
            f"Event reminder 24h notifications: {result['sent']} sent, {result['failed']} failed out of {result['total']} total"
        )
        return result['sent']
    except Exception as e:
        logger.error(f"Error in send_event_reminder_24h: {str(e)}")
        return 0


@shared_task
def send_event_reminder_3h():
    """Send reminders for events starting in ~3 hours.

    Window: events with starts_at between (now + 3h) and (now + 4h).
    """
    try:
        now = timezone.now()
        start_window = now + timezone.timedelta(hours=3)
        end_window = now + timezone.timedelta(hours=4)

        events = (
            Event.objects
            .filter(
                verified=True,
                starts_at__gte=start_window,
                starts_at__lt=end_window,
                publication_date__lte=timezone.localdate()
            )
            .select_related('organization', 'category')
        )

        if not events.exists():
            logger.info("No events starting ~3h from now for reminders")
            return 0

        result = push_service.send_event_reminders_for_events(events, reminder_type='event_reminder_3h')
        logger.info(
            f"Event reminder 3h notifications: {result['sent']} sent, {result['failed']} failed out of {result['total']} total"
        )
        return result['sent']
    except Exception as e:
        logger.error(f"Error in send_event_reminder_3h: {str(e)}")
        return 0



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


@shared_task
def send_batch_notifications(notifications_data):
    """
    Send a batch of notifications using the push service.

    Args:
        notifications_data: List of notification data dictionaries

    Returns:
        Dict with counts: {'sent': int, 'failed': int, 'total': int}
    """
    try:
        result = push_service.send_multiple_notifications(notifications_data)
        logger.info(f"Batch notifications completed: {result['sent']} sent, {result['failed']} failed out of {result['total']} total")
        return result
    except Exception as e:
        logger.error(f"Error sending batch notifications: {str(e)}")
        return {'sent': 0, 'failed': 0, 'total': 0}


@shared_task
def send_post_verification_notifications(post_id):
    """
    Send notifications to users who liked the event when a post is verified.

    Args:
        post_id: The UUID of the verified post

    Returns:
        Dict with counts: {'sent': int, 'failed': int, 'total': int}
    """
    try:
        from core.models import Post

        # Get the post instance
        post = Post.objects.select_related('event', 'organization').get(id=post_id)

        if not post.verified:
            logger.warning(f"Post {post_id} is not verified, skipping notifications")
            return {'sent': 0, 'failed': 0, 'total': 0}

        # Send notifications using the push service
        result = push_service.send_post_verification_notifications(post)

        logger.info(f"Post verification notifications for post {post_id}: {result['sent']} sent, {result['failed']} failed out of {result['total']} total")
        return result

    except Post.DoesNotExist:
        logger.error(f"Post {post_id} not found")
        return {'sent': 0, 'failed': 0, 'total': 0}
    except Exception as e:
        logger.error(f"Error sending post verification notifications for post {post_id}: {str(e)}")
        return {'sent': 0, 'failed': 0, 'total': 0}


@shared_task
def send_new_event_notifications_to_staff(event_id: str):
    """
    Send push notifications about a newly created event to all staff users' devices.

    Args:
        event_id: UUID of the newly created event

    Returns:
        Dict with counts: {'sent': int, 'failed': int, 'total': int}
    """
    try:
        event = Event.objects.select_related('organization', 'category').get(id=event_id)
        result = push_service.send_new_event_to_staff(event)
        logger.info(
            f"New event staff notifications for event {event_id}: {result['sent']} sent, {result['failed']} failed out of {result['total']} total"
        )
        return result
    except Event.DoesNotExist:
        logger.error(f"Event {event_id} not found for staff notification task")
        return {'sent': 0, 'failed': 0, 'total': 0}
    except Exception as e:
        logger.error(f"Error sending new event notifications to staff for event {event_id}: {str(e)}")
        return {'sent': 0, 'failed': 0, 'total': 0}