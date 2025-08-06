# Push Notifications Implementation

This document describes the complete push notification system implemented for the PWr Now app.

## Overview

The push notification system allows users to receive real-time notifications on their mobile devices when new events are verified by administrators. The system uses Expo Push Notifications service for reliable delivery across iOS and Android platforms.

## Architecture

### Backend Components

1. **notifications App** - New Django app handling push notifications
2. **Device Model** - Stores push tokens and user preferences
3. **PushNotification Model** - Tracks sent notifications and delivery status
4. **Push Service** - Handles communication with Expo Push API
5. **Celery Tasks** - Asynchronous notification processing
6. **Signal Handlers** - Triggers notifications on event verification

### Mobile Components

1. **Push Notification Service** - Handles token registration and permissions
2. **React Hook** - Easy integration into React components
3. **Notification Settings** - User preference management
4. **Deep Linking** - Navigation to events from notifications

## Backend Implementation

### Models

#### Device Model

```python
class Device(models.Model):
    expo_push_token = models.CharField(max_length=200, unique=True)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    device_name = models.CharField(max_length=100, blank=True, null=True)
    notifications_enabled = models.BooleanField(default=True)
    preferred_categories = models.ManyToManyField('core.Category', blank=True)
    last_active_at = models.DateTimeField(auto_now=True)
```

#### PushNotification Model

```python
class PushNotification(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(default=dict)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    sent_at = models.DateTimeField(blank=True, null=True)
```

### API Endpoints

- `POST /v1/api/devices/` - Register device
- `PATCH /v1/api/devices/{token}/` - Update preferences
- `POST /v1/api/devices/{token}/ping/` - Update last active
- `GET /v1/api/notifications/` - View notification history

### Event Verification Trigger

When an event's `verified` field changes from `False` to `True`, the system:

1. Signal handler detects the change
2. Celery task is queued for async processing
3. Eligible devices are identified based on:
   - Notifications enabled
   - Device is active (last 30 days)
   - Category preferences match (if specified)
4. Notifications are sent via Expo Push API
5. Delivery status is tracked and updated

## Mobile Implementation

### Setup

The mobile app automatically initializes push notifications on startup:

```typescript
import { usePushNotifications } from '../lib/push-notifications';

export default function App() {
  const { expoPushToken, isRegistered } = usePushNotifications();

  // Push notifications are automatically set up
}
```

### User Preferences

Users can configure:

- Enable/disable notifications
- Select specific event categories
- View notification history

### Notification Handling

When a notification is received:

1. Foreground: Banner is shown with sound/vibration
2. Background: Standard system notification
3. Tap: App opens to event detail page

## Configuration

### Backend Settings

Add to `settings.py`:

```python
INSTALLED_APPS = [
    # ...
    'notifications',
]

CELERY_BEAT_SCHEDULE = {
    'update-notification-delivery-status': {
        'task': 'notifications.tasks.update_notification_delivery_status',
        'schedule': crontab(minute='*/5'),
    },
}
```

### Mobile App Configuration

Add to `app.json`:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#ffffff",
        "defaultChannel": "default"
      }
    ]
  ]
}
```

## Testing

### Backend Tests

Run tests with:

```bash
docker compose exec backend python manage.py test notifications
```

### Mobile Testing

1. Build development app with EAS
2. Install on physical device
3. Register device in admin panel
4. Create and verify an event
5. Check notification delivery

### Manual Testing Flow

1. **Device Registration**

   - Install app on device
   - App automatically requests permissions
   - Device appears in Django admin

2. **Event Creation**

   - Create event in admin panel
   - Event starts unverified

3. **Event Verification**

   - Mark event as verified in admin
   - Notification should be sent immediately
   - Check notification appears on device

4. **Preferences**
   - Disable notifications in app
   - Verify no notifications received
   - Re-enable and test again

## Monitoring

### Admin Interface

- View all registered devices
- Monitor notification delivery status
- Send test notifications
- View delivery statistics

### Logs

Monitor application logs for:

- Device registrations
- Notification sending attempts
- Expo API responses
- Delivery confirmations

### Celery Tasks

- `send_event_verification_notifications` - Send notifications for verified events
- `update_notification_delivery_status` - Check delivery receipts
- `cleanup_old_notifications` - Remove old notification records
- `cleanup_inactive_devices` - Remove inactive devices

## Error Handling

The system handles various error scenarios:

1. **Invalid Push Tokens** - Automatically removes invalid devices
2. **Network Failures** - Retries with exponential backoff
3. **Expo API Errors** - Logs errors and marks notifications as failed
4. **Permission Denied** - Respects user notification preferences

## Security

- Device tokens are stored securely
- No sensitive user data in notifications
- Rate limiting on API endpoints
- Automatic cleanup of inactive devices

## Performance

- Asynchronous processing prevents blocking
- Batch processing for multiple devices
- Database indexes for fast queries
- Automatic cleanup of old data

## Future Enhancements

Potential improvements:

1. Rich notifications with images
2. Notification scheduling for future events
3. Push notification analytics
4. A/B testing for notification content
5. Advanced targeting rules
