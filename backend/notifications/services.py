import requests
import json
import logging
from typing import List, Dict, Optional
from django.conf import settings
from django.utils import timezone
from .models import Device, PushNotification
from core.models import Event
from core.translation_utils import get_translated_field
from django.conf import settings

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
        data: Optional[Dict] = None
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
            message = {
                'to': device.expo_push_token,
                'sound': 'default',
                'title': title,
                'body': body,
                'data': data or {},
                'priority': 'high',
                'channelId': 'default',
            }

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
        """Send verification notification for an event to all eligible devices."""

        # Get all active devices with notifications enabled
        devices = Device.objects.filter(
            notifications_enabled=True,
            last_active_at__gte=timezone.now() - timezone.timedelta(days=30)
        )

        # All devices get notifications
        eligible_devices = list(devices)

        if not eligible_devices:
            logger.info(f"No eligible devices for event {event.id}")
            return 0

        # Prepare base data
        data = {
            'type': 'event_verified',
            'event_id': str(event.id),
            'event_slug': event.slug,
            'category_slug': event.category.slug if event.category else None,
            'organization_slug': event.organization.slug if event.organization else None,
        }

        # Send notifications per-device with localized content
        success_count = 0
        for device in eligible_devices:
            lang = (getattr(device, 'preferred_language', None) or settings.LANGUAGE_CODE).split('-')[0]

            # Localize title
            title = "🎉 " + ("Nowe wydarzenie!" if lang == 'pl' else "New event!")

            # Localize body using translated event fields
            localized_title = get_translated_field(event, 'title', lang)
            body_parts = [f"{localized_title}"] if localized_title else []

            if event.starts_at:
                from django.utils.dateformat import format
                formatted_date = format(event.starts_at, 'd.m.Y H:i')
                body_parts.append(formatted_date)

            if event.location:
                body_parts.append(event.location)

            body = " • ".join(body_parts)

            if self.send_notification_to_device(device, title, body, data):
                success_count += 1

        logger.info(f"Sent {success_count}/{len(eligible_devices)} notifications for event {event.id}")
        return success_count

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
            return

        ticket_ids = [n.expo_ticket_id for n in pending_notifications]
        receipts = self.check_delivery_receipts(ticket_ids)

        for notification in pending_notifications:
            receipt = receipts.get(notification.expo_ticket_id)
            if receipt:
                if receipt.get('status') == 'ok':
                    notification.status = 'delivered'
                    notification.delivered_at = timezone.now()
                elif receipt.get('status') == 'error':
                    notification.status = 'failed'
                    notification.error_message = receipt.get('message', 'Delivery failed')

                notification.save()


# Singleton instance
push_service = ExpoPushNotificationService()