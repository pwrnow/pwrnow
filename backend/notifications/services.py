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

    def send_event_verification_notification(self, event: Event) -> int:
        """Send push notification when an event is verified."""
        try:
            # Get all active devices
            devices = Device.objects.filter(
                notifications_enabled=True
            )

            if not devices.exists():
                logger.info("No active devices found for notifications")
                return 0

            # Prepare notification content
            title = _("New Event Verified! 🎉")
            body = _("Event '{event_title}' has been verified and is now live!").format(
                event_title=event.title
            )

            # Send notifications to all devices
            sent_count = 0
            for device in devices:
                try:
                    success = self.send_notification_to_device(
                        device=device,
                        title=title,
                        body=body,
                        data={
                            'type': 'event_verified',
                            'event_id': str(event.id),
                            'event_slug': event.slug,
                            'organization_slug': event.organization.slug
                        }
                    )

                    if success:
                        # Create notification record
                        PushNotification.objects.create(
                            device=device,
                            title=title,
                            body=body,
                            data={
                                'type': 'event_verified',
                                'event_id': str(event.id),
                                'event_slug': event.slug,
                                'organization_slug': event.organization.slug
                            }
                        )
                        sent_count += 1

                except Exception as e:
                    logger.error(f"Error sending notification to device {device.id}: {str(e)}")
                    continue

            logger.info(f"Sent verification notifications to {sent_count} devices for event {event.title}")
            return sent_count

        except Exception as e:
            logger.error(f"Error sending event verification notifications: {str(e)}")
            return 0

    def send_event_publication_notification(self, event: Event) -> int:
        """Send push notification when an event is published (on publication_date)."""
        try:
            # Get all active devices
            devices = Device.objects.filter(
                notifications_enabled=True
            )

            if not devices.exists():
                logger.info("No active devices found for publication notifications")
                return 0

            # Prepare notification content
            title = _("New Event Published! 🚀")
            body = _("Event '{event_title}' is now live on the website!").format(
                event_title=event.title
            )

            # Send notifications to all devices
            sent_count = 0
            for device in devices:
                try:
                    success = self.send_notification_to_device(
                        device=device,
                        title=title,
                        body=body,
                        data={
                            'type': 'event_published',
                            'event_id': str(event.id),
                            'event_slug': event.slug,
                            'organization_slug': event.organization.slug
                        }
                    )

                    if success:
                        # Create notification record
                        PushNotification.objects.create(
                            device=device,
                            title=title,
                            body=body,
                            data={
                                'type': 'event_published',
                                'event_id': str(event.id),
                                'event_slug': event.slug,
                                'organization_slug': event.organization.slug
                            }
                        )
                        sent_count += 1

                except Exception as e:
                    logger.error(f"Error sending publication notification to device {device.id}: {str(e)}")
                    continue

            logger.info(f"Sent publication notifications to {sent_count} devices for event {event.title}")
            return sent_count

        except Exception as e:
            logger.error(f"Error sending event publication notifications: {str(e)}")
            return 0

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