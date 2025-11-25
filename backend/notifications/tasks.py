import logging
from celery import shared_task
from django.utils import timezone
from .models import Device, PushNotification
from .services import push_service
from core.models import Event, Like

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
    """
    Send reminders for events starting in approximately 24 hours.

    Bulletproof logic:
    - Runs every minute
    - Checks events starting in 23h50m to 24h10m window (20-minute window)
    - Uses PushNotification table for duplicate detection per user per event
    - Processes each user independently to avoid partial failures
    """
    return _send_event_reminders(
        reminder_type='event_reminder_24h',
        hours_before=24,
        window_minutes=10,
    )


@shared_task
def send_event_reminder_3h():
    """
    Send reminders for events starting in approximately 3 hours.

    Bulletproof logic:
    - Runs every minute
    - Checks events starting in 2h50m to 3h10m window (20-minute window)
    - Uses PushNotification table for duplicate detection per user per event
    - Processes each user independently to avoid partial failures
    """
    return _send_event_reminders(
        reminder_type='event_reminder_3h',
        hours_before=3,
        window_minutes=10,
    )


def _send_event_reminders(reminder_type: str, hours_before: int, window_minutes: int = 10):
    """
    Core logic for sending event reminders with bulletproof duplicate prevention.

    Uses existing PushNotification table to track sent reminders.
    Checks for existing notifications with matching (user, event_id, reminder_type).

    Args:
        reminder_type: Type of reminder (event_reminder_24h or event_reminder_3h)
        hours_before: Hours before event to send reminder
        window_minutes: Buffer window in minutes (±) around target time

    Returns:
        Total number of notifications sent
    """
    try:
        now = timezone.now()

        # Calculate time window centered around the target time
        target_time = now + timezone.timedelta(hours=hours_before)
        start_window = target_time - timezone.timedelta(minutes=window_minutes)
        end_window = target_time + timezone.timedelta(minutes=window_minutes)

        logger.info(
            f"[{reminder_type}] Checking for events starting between "
            f"{start_window.isoformat()} and {end_window.isoformat()}"
        )

        # Get all verified events in the window that are already published
        events = list(
            Event.objects
            .filter(
                verified=True,
                starts_at__gte=start_window,
                starts_at__lt=end_window,
                publication_date__lte=timezone.localdate()
            )
            .select_related('organization', 'category')
        )

        if not events:
            logger.debug(f"[{reminder_type}] No events in window")
            return 0

        logger.info(f"[{reminder_type}] Found {len(events)} events in window")

        total_sent = 0
        total_users_processed = 0
        total_already_sent = 0

        for event in events:
            try:
                # Get users who liked this event
                liked_user_ids = list(
                    Like.objects
                    .filter(event=event)
                    .values_list('user_id', flat=True)
                )

                if not liked_user_ids:
                    logger.debug(f"[{reminder_type}] No likes for event {event.id}")
                    continue

                logger.info(
                    f"[{reminder_type}] Event {event.id} ({event.title}) has "
                    f"{len(liked_user_ids)} liked users"
                )

                # Get all devices for liked users
                devices_by_user = {}
                all_devices = Device.objects.filter(
                    user_id__in=liked_user_ids,
                    notifications_enabled=True
                )
                for device in all_devices:
                    if device.user_id not in devices_by_user:
                        devices_by_user[device.user_id] = []
                    devices_by_user[device.user_id].append(device)

                # Check which users already received this reminder for this event
                # by looking at existing PushNotification records
                existing_user_ids = set(
                    PushNotification.objects
                    .filter(
                        device__user_id__in=liked_user_ids,
                        data__type=reminder_type,
                        data__event_id=str(event.id),
                        status__in=['sent', 'delivered', 'pending']
                    )
                    .values_list('device__user_id', flat=True)
                    .distinct()
                )

                # Process each user
                for user_id in liked_user_ids:
                    try:
                        # Skip if already sent to this user
                        if user_id in existing_user_ids:
                            total_already_sent += 1
                            logger.debug(
                                f"[{reminder_type}] Already sent to user {user_id} "
                                f"for event {event.id}"
                            )
                            continue

                        # Get user's devices
                        user_devices = devices_by_user.get(user_id, [])
                        if not user_devices:
                            logger.debug(
                                f"[{reminder_type}] No active devices for user {user_id}"
                            )
                            continue

                        # Send notification to this user's devices
                        sent_count = push_service.send_event_reminder_to_user(
                            event=event,
                            user_id=user_id,
                            devices=user_devices,
                            reminder_type=reminder_type,
                        )

                        total_sent += sent_count
                        total_users_processed += 1

                        logger.info(
                            f"[{reminder_type}] Sent {sent_count} notifications to user "
                            f"{user_id} for event {event.id}"
                        )

                    except Exception as e:
                        logger.error(
                            f"[{reminder_type}] Error processing user {user_id} "
                            f"for event {event.id}: {str(e)}"
                        )
                        continue

            except Exception as e:
                logger.error(
                    f"[{reminder_type}] Error processing event {event.id}: {str(e)}"
                )
                continue

        logger.info(
            f"[{reminder_type}] Completed: {total_sent} notifications sent to "
            f"{total_users_processed} users, {total_already_sent} already sent"
        )

        return total_sent

    except Exception as e:
        logger.error(f"[{reminder_type}] Fatal error: {str(e)}")
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