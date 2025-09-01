import requests
import json
import logging
from typing import List, Dict, Optional, Tuple
from django.conf import settings
from django.utils import timezone
from django.utils import formats
from django.utils.translation import gettext as _
from django.utils.translation import override
from .models import Device, PushNotification
from core.models import Event
from core.translation_utils import get_translated_field
# Duplicate import removed

logger = logging.getLogger(__name__)


class ExpoPushNotificationService:
    """Service for sending push notifications via Expo Push API."""

    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    EXPO_RECEIPT_URL = "https://exp.host/--/api/v2/push/getReceipts"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        })

    def send_notification_to_device(
        self,
        device: Device,
        title: str,
        body: str,
        data: Optional[Dict] = None,
        subtitle: Optional[str] = None,
    ) -> bool:
        """Send a single notification to a device."""

        if not device.notifications_enabled:
            logger.info(f"Notifications disabled for device {device.id}")
            return False

        if not device.is_active():
            logger.info(f"Device {device.id} is inactive, skipping notification")
            return False

        # Create notification record
        notification = PushNotification.objects.create(
            title=title,
            body=body,
            data=data or {},
            device=device,
            status='pending'
        )

        try:
            # Prepare the message
            message: Dict[str, object] = {
                'to': device.expo_push_token,
                'sound': 'default',
                'title': title,
                'body': body,
                'data': data or {},
                'priority': 'high',
                'channelId': 'default',
            }

            # Optional iOS-only subtitle (ignored on Android)
            if subtitle:
                message['subtitle'] = subtitle

            # Send to Expo
            response = self.session.post(
                self.EXPO_PUSH_URL,
                data=json.dumps(message),
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()

                if result.get('data'):
                    ticket = result['data'][0] if isinstance(result['data'], list) else result['data']

                    if ticket.get('status') == 'ok':
                        notification.status = 'sent'
                        notification.expo_ticket_id = ticket.get('id')
                        notification.sent_at = timezone.now()
                        notification.save()
                        logger.info(f"Successfully sent notification to device {device.id}")
                        return True
                    else:
                        # Handle Expo error
                        error_details = ticket.get('details', {})
                        error_message = error_details.get('error', 'Unknown Expo error')
                        notification.status = 'failed'
                        notification.error_message = f"Expo error: {error_message}"
                        notification.save()
                        logger.error(f"Expo rejected notification for device {device.id}: {error_message}")
                        return False
                else:
                    notification.status = 'failed'
                    notification.error_message = "No data in Expo response"
                    notification.save()
                    logger.error(f"No data in Expo response for device {device.id}")
                    return False
            else:
                notification.status = 'failed'
                notification.error_message = f"HTTP {response.status_code}: {response.text}"
                notification.save()
                logger.error(f"Failed to send notification to device {device.id}: {response.status_code}")
                return False

        except Exception as e:
            notification.status = 'failed'
            notification.error_message = str(e)
            notification.save()
            logger.error(f"Exception sending notification to device {device.id}: {str(e)}")
            return False

    def send_multiple_notifications(self, notifications_data, max_batch_size=100):
        """
        Send multiple notifications in batches up to 100 (Expo API limit).

        Args:
            notifications_data: List of notification data dictionaries, each containing:
                - to: Push token(s) - can be string or list of strings
                - title: Notification title
                - body: Notification body
                - data: Optional notification data
                - sound: Optional sound (default: 'default')
                - badge: Optional badge count
                - subtitle: Optional subtitle (iOS only)
                - priority: Optional priority (default: 'high')
                - channelId: Optional channel ID (default: 'default')
            max_batch_size: Maximum notifications per batch (default 100, Expo limit)

        Returns:
            Dict with counts: {'sent': int, 'failed': int, 'total': int}
        """
        if not notifications_data:
            return {'sent': 0, 'failed': 0, 'total': 0}

        total_count = len(notifications_data)
        total_sent = 0
        total_failed = 0

        logger.info(f"Starting batch notification sending for {total_count} notifications")

        # Process in batches
        for i in range(0, total_count, max_batch_size):
            batch = notifications_data[i:i + max_batch_size]
            batch_result = self._send_notification_batch(batch)
            total_sent += batch_result['sent']
            total_failed += batch_result['failed']

        logger.info(f"Batch notification completed: {total_sent} sent, {total_failed} failed out of {total_count} total")
        return {
            'sent': total_sent,
            'failed': total_failed,
            'total': total_count
        }

    def _send_notification_batch(self, notifications_batch):
        """
        Send a batch of notifications to Expo API.

        Args:
            notifications_batch: List of notification data (max 100)

        Returns:
            Dict with counts: {'sent': int, 'failed': int}
        """
        if not notifications_batch:
            return {'sent': 0, 'failed': 0}

        try:
            # Prepare batch payload for Expo API
            messages = []
            for notification_data in notifications_batch:
                # Ensure required fields are present
                if 'to' not in notification_data or 'body' not in notification_data:
                    logger.warning(f"Skipping notification missing required fields: {notification_data}")
                    continue

                # Build message with defaults
                message = {
                    'to': notification_data['to'],
                    'body': notification_data['body'],
                    'sound': notification_data.get('sound', 'default'),
                    'priority': notification_data.get('priority', 'high'),
                    'channelId': notification_data.get('channelId', 'default'),
                }

                # Add optional fields if present
                if 'title' in notification_data:
                    message['title'] = notification_data['title']
                if 'data' in notification_data:
                    message['data'] = notification_data['data']
                if 'badge' in notification_data:
                    message['badge'] = notification_data['badge']
                if 'subtitle' in notification_data:
                    message['subtitle'] = notification_data['subtitle']

                messages.append(message)

            if not messages:
                return {'sent': 0, 'failed': 0}

            # Send batch to Expo API
            response = self.session.post(
                self.EXPO_PUSH_URL,
                data=json.dumps(messages),
                timeout=10  # Reduced timeout for batch requests
            )

            if response.status_code == 200:
                result = response.json()
                tickets = result.get('data', [])

                # Count successful and failed notifications
                sent_count = 0
                failed_count = 0

                for ticket in tickets:
                    if ticket.get('status') == 'ok':
                        sent_count += 1
                    else:
                        failed_count += 1
                        error_details = ticket.get('details', {})
                        error_message = error_details.get('error', 'Unknown Expo error')
                        logger.warning(f"Expo notification failed: {error_message}")

                logger.info(f"Batch notification result: {sent_count} sent, {failed_count} failed")
                return {'sent': sent_count, 'failed': failed_count}

            else:
                logger.error(f"Failed to send batch notifications: HTTP {response.status_code} - {response.text}")
                return {'sent': 0, 'failed': len(messages)}

        except Exception as e:
            logger.error(f"Exception sending batch notifications: {str(e)}")
            return {'sent': 0, 'failed': len(notifications_batch)}



    def send_publication_notifications_for_events(self, events):
        """
        Send publication notifications for multiple events in a single batch.

        Args:
            events: QuerySet or list of Event objects to send notifications for

        Returns:
            Dict with counts: {'sent': int, 'failed': int, 'total': int}
        """
        try:
            # Get all active devices
            devices = Device.objects.filter(notifications_enabled=True)

            if not devices.exists():
                logger.info("No active devices found for publication notifications")
                return {'sent': 0, 'failed': 0, 'total': 0}

            # Collect all notifications for all events and devices
            all_notifications_data = []
            notification_records = []  # Store notification data with device info for record creation

            for i, event in enumerate(events):
                try:
                    # Build notifications for this event
                    for device in devices:
                        # Determine language preference (default to Polish)
                        lang = getattr(device, 'preferred_language', 'pl') or 'pl'

                        # Build notification content using enhanced formatting
                        title, body, subtitle = self._build_notification_content(event, lang)

                        # Create notification data
                        notification_data = {
                            'to': device.expo_push_token,
                            'title': title,
                            'body': body,
                            'data': {
                                'type': 'event_published',
                                'event_id': str(event.id),
                                'event_slug': event.slug,
                                'organization_slug': event.organization.slug if event.organization else None,
                                'category_slug': event.category.slug if event.category else None,
                            },
                            'priority': 'high',
                            'channelId': 'events',
                            'sound': 'default' if i == 0 else None  # Only first event has sound
                        }

                        # Add subtitle for iOS devices
                        if subtitle and device.platform == 'ios':
                            notification_data['subtitle'] = subtitle

                        all_notifications_data.append(notification_data)

                        # Store notification record data with device info
                        notification_records.append({
                            'title': title,
                            'body': body,
                            'data': notification_data['data'],
                            'device': device,
                            'event': event
                        })

                    logger.info(f"Prepared {devices.count()} notifications for event {event.title}")

                except Exception as e:
                    logger.error(f"Error preparing notifications for event {event.id}: {str(e)}")
                    continue

            if not all_notifications_data:
                logger.info("No notifications to send")
                return {'sent': 0, 'failed': 0, 'total': 0}

            # Send ALL notifications in a single batch
            result = self.send_multiple_notifications(all_notifications_data)

            # Create notification records for successful sends
            if result['sent'] > 0:
                # Create notification records for all notifications
                for record_data in notification_records:
                    try:
                        PushNotification.objects.create(
                            title=record_data['title'],
                            body=record_data['body'],
                            data=record_data['data'],
                            device=record_data['device'],
                            status='sent'
                        )
                    except Exception as e:
                        logger.error(f"Error creating notification record: {str(e)}")

            logger.info(f"Batch publication notifications completed: {result['sent']} sent, {result['failed']} failed out of {len(all_notifications_data)} total")
            return result

        except Exception as e:
            logger.error(f"Error sending batch publication notifications: {str(e)}")
            return {'sent': 0, 'failed': 0, 'total': 0}



    # --- Helpers ---------------------------------------------------------

    def _truncate(self, text: Optional[str], max_length: int) -> str:
        if not text:
            return ""
        return text if len(text) <= max_length else text[: max_length - 1] + "…"

    def _format_event_range(self, starts_at, ends_at, lang: str) -> str:
        """Return a localized, human-friendly date/time range for the event.

        Rules:
        - If the range is within the current ISO week: show weekday names with times.
        - Otherwise: show full dates with verbose month names and times.
        - Always prefix with a calendar icon.
        """
        if not starts_at:
            return ""

        local_start = timezone.localtime(starts_at)
        local_end = timezone.localtime(ends_at) if ends_at else None

        start_date = local_start.date()
        end_date = local_end.date() if local_end else start_date
        today = timezone.localdate()
        show_year = start_date.year != end_date.year

        start_iso_year, start_iso_week, _ = start_date.isocalendar()
        today_iso_year, today_iso_week, _ = today.isocalendar()
        end_iso_year, end_iso_week, _ = end_date.isocalendar()

        in_this_week = (
            start_iso_year == today_iso_year == end_iso_year and
            start_iso_week == today_iso_week == end_iso_week
        )

        with override(lang):
            time_start = formats.date_format(local_start, 'TIME_FORMAT')
            time_end = formats.date_format(local_end, 'TIME_FORMAT') if local_end else None

            if start_date == end_date:
                if in_this_week:
                    # e.g., "📅 Wednesday 14:00–16:30"
                    weekday = formats.date_format(local_start, 'l')
                    return f"📅 {weekday} {time_start}–{time_end}" if time_end else f"📅 {weekday} {time_start}"
                # e.g., "📅 12 September, 14:00–16:30" (year omitted unless cross-year)
                full_date = formats.date_format(local_start, 'j F Y' if show_year else 'j F')
                return f"📅 {full_date}, {time_start}–{time_end}" if time_end else f"📅 {full_date}, {time_start}"

            # Multi-day events
            if in_this_week:
                # e.g., "📅 Wed 18:00 – Fri 10:00"
                weekday_start = formats.date_format(local_start, 'D')
                weekday_end = formats.date_format(local_end, 'D') if local_end else None
                if time_end and weekday_end:
                    return f"📅 {weekday_start} {time_start} – {weekday_end} {time_end}"
                return f"📅 {weekday_start} {time_start}"

            # Not in current week → use full dates with verbose month, omit year unless cross-year
            fmt = 'j F Y' if show_year else 'j F'
            date_start_verbose = formats.date_format(local_start, fmt)
            date_end_verbose = formats.date_format(local_end, fmt) if local_end else None
            if time_end and date_end_verbose:
                return f"📅 {date_start_verbose} {time_start} – {date_end_verbose} {time_end}"
            return f"📅 {date_start_verbose} {time_start}"

    def _build_notification_content(self, event: Event, lang: str) -> Tuple[str, str, Optional[str]]:
        with override(lang):
            # Title: generic, localized
            title_text = _("New event available")
            title = self._truncate(f"✨ {title_text}", 100)

            # Subtitle: event title (localized)
            localized_event_title = get_translated_field(event, 'title', lang) or event.title
            subtitle = self._truncate(localized_event_title, 100)

            # Body: single line human-friendly, localized date/time range
            event_time = self._format_event_range(event.starts_at, event.ends_at, lang)
            body_lines: List[str] = []
            if event_time:
                body_lines.append(event_time)
            body = self._truncate("\n".join(body_lines), 140)

            return title, body, subtitle

    def check_delivery_receipts(self, ticket_ids: List[str]) -> Dict:
        """Check delivery receipts for sent notifications."""

        if not ticket_ids:
            return {}

        try:
            response = self.session.post(
                self.EXPO_RECEIPT_URL,
                data=json.dumps({'ids': ticket_ids}),
                timeout=10
            )

            if response.status_code == 200:
                return response.json().get('data', {})
            else:
                logger.error(f"Failed to get receipts: {response.status_code}")
                return {}

        except Exception as e:
            logger.error(f"Exception getting receipts: {str(e)}")
            return {}

    def update_delivery_status(self):
        """Update delivery status for sent notifications."""

        # Get notifications that were sent but not yet delivered
        pending_notifications = PushNotification.objects.filter(
            status='sent',
            expo_ticket_id__isnull=False
        )

        if not pending_notifications:
            return 0

        ticket_ids = [n.expo_ticket_id for n in pending_notifications]
        receipts = self.check_delivery_receipts(ticket_ids)

        updated_count = 0
        for notification in pending_notifications:
            receipt = receipts.get(notification.expo_ticket_id)
            if receipt:
                if receipt.get('status') == 'ok':
                    notification.status = 'delivered'
                    notification.delivered_at = timezone.now()
                    updated_count += 1
                elif receipt.get('status') == 'error':
                    notification.status = 'failed'
                    notification.error_message = receipt.get('message', 'Delivery failed')
                    updated_count += 1

                notification.save()

        return updated_count


# Singleton instance
push_service = ExpoPushNotificationService()