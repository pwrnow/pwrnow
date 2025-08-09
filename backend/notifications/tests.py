from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
from core.models import Event, Category, Organization
from .models import Device, PushNotification
from .services import push_service


class DeviceModelTest(TestCase):
    def setUp(self):
        self.device = Device.objects.create(
            expo_push_token="ExponentPushToken[test-token-123]",
            platform="ios",
            device_name="Test iPhone",
            app_version="1.0.0",
            notifications_enabled=True
        )

    def test_device_creation(self):
        """Test device creation with required fields."""
        self.assertEqual(self.device.expo_push_token, "ExponentPushToken[test-token-123]")
        self.assertEqual(self.device.platform, "ios")
        self.assertTrue(self.device.notifications_enabled)

    def test_device_is_active(self):
        """Test device activity check."""
        # Recently created device should be active
        self.assertTrue(self.device.is_active())

        # Device older than 30 days should be inactive
        old_date = timezone.now() - timezone.timedelta(days=31)
        # Bypass auto_now by updating directly
        Device.objects.filter(id=self.device.id).update(last_active_at=old_date)
        self.device.refresh_from_db()
        self.assertFalse(self.device.is_active())


class PushNotificationServiceTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-organization"
        )
        self.event = Event.objects.create(
            title="Test Event",
            slug="test-event",
            starts_at=timezone.now() + timezone.timedelta(days=1),
            ends_at=timezone.now() + timezone.timedelta(days=1, hours=2),
            category=self.category,
            organization=self.organization,
            verified=True,
            verified_at=timezone.now()
        )
        self.device = Device.objects.create(
            expo_push_token="ExponentPushToken[test-token-123]",
            platform="ios",
            device_name="Test iPhone",
            notifications_enabled=True
        )

    @patch('notifications.services.requests.Session.post')
    def test_send_notification_success(self, mock_post):
        """Test successful notification sending."""
        # Mock successful Expo response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {'status': 'ok', 'id': 'test-ticket-id'}
        }
        mock_post.return_value = mock_response

        # Send notification
        success = push_service.send_notification_to_device(
            device=self.device,
            title="Test Notification",
            body="Test body"
        )

        self.assertTrue(success)

        # Check notification record was created
        notification = PushNotification.objects.get(device=self.device)
        self.assertEqual(notification.status, 'sent')
        self.assertEqual(notification.expo_ticket_id, 'test-ticket-id')

    @patch('notifications.services.requests.Session.post')
    def test_send_notification_expo_error(self, mock_post):
        """Test notification sending with Expo error."""
        # Mock Expo error response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {'status': 'error', 'details': {'error': 'InvalidCredentials'}}
        }
        mock_post.return_value = mock_response

        # Send notification
        success = push_service.send_notification_to_device(
            device=self.device,
            title="Test Notification",
            body="Test body"
        )

        self.assertFalse(success)

        # Check notification record was created with error
        notification = PushNotification.objects.get(device=self.device)
        self.assertEqual(notification.status, 'failed')
        self.assertIn('InvalidCredentials', notification.error_message)

    def test_send_notification_disabled_device(self):
        """Test that notifications are not sent to disabled devices."""
        self.device.notifications_enabled = False
        self.device.save()

        success = push_service.send_notification_to_device(
            device=self.device,
            title="Test Notification",
            body="Test body"
        )

        self.assertFalse(success)

        # No notification record should be created
        self.assertFalse(
            PushNotification.objects.filter(device=self.device).exists()
        )

    @patch('notifications.services.requests.Session.post')
    def test_send_event_verification_notification(self, mock_post):
        """Test sending verification notifications for an event."""
        # Mock successful Expo response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'data': {'status': 'ok', 'id': 'test-ticket-id'}
        }
        mock_post.return_value = mock_response

        # Create another device
        device2 = Device.objects.create(
            expo_push_token="ExponentPushToken[test-token-456]",
            platform="android",
            device_name="Test Android",
            notifications_enabled=True
        )

        # Send notifications
        count = push_service.send_event_verification_notification(self.event)

        self.assertEqual(count, 2)  # Should send to both devices

        # Check notifications were created for both devices
        notifications = PushNotification.objects.all()
        self.assertEqual(notifications.count(), 2)

        for notification in notifications:
            self.assertEqual(notification.status, 'sent')
            self.assertIn(self.event.title, notification.body)


class SignalTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category"
        )
        self.organization = Organization.objects.create(
            name="Test Organization",
            slug="test-organization"
        )

    @patch('notifications.tasks.send_event_verification_notifications.delay')
    def test_event_verification_signal(self, mock_task):
        """Test that signal triggers notification task when event is verified."""
        # Create unverified event
        event = Event.objects.create(
            title="Test Event",
            slug="test-event",
            starts_at=timezone.now() + timezone.timedelta(days=1),
            ends_at=timezone.now() + timezone.timedelta(days=1, hours=2),
            category=self.category,
            organization=self.organization,
            verified=False
        )

        # Verify the event (this should trigger the signal)
        event.verified = True
        event.save()

        # Check that the task was called
        mock_task.assert_called_once_with(str(event.id))