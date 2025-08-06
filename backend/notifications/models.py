import uuid
from django.db import models
from django.utils import timezone


class Device(models.Model):
    """Device model to store Expo push tokens and device information."""

    PLATFORM_CHOICES = [
        ('ios', 'iOS'),
        ('android', 'Android'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    # Expo push token
    expo_push_token = models.CharField(
        max_length=200,
        unique=True,
        help_text="Expo push token for this device"
    )

    # Device information
    platform = models.CharField(
        max_length=10,
        choices=PLATFORM_CHOICES,
        help_text="Platform of the device"
    )
    device_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Human readable device name"
    )
    app_version = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Version of the app"
    )

    # Notification preferences
    notifications_enabled = models.BooleanField(
        default=True,
        help_text="Whether push notifications are enabled for this device"
    )



    # Tracking
    last_active_at = models.DateTimeField(
        auto_now=True,
        help_text="Last time this device was active"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['expo_push_token']),
            models.Index(fields=['platform']),
            models.Index(fields=['notifications_enabled']),
            models.Index(fields=['last_active_at']),
        ]

    def __str__(self):
        return f"{self.device_name or 'Unknown Device'} ({self.platform}) - {self.expo_push_token[:20]}..."

    def is_active(self):
        """Check if device is active (last active within 30 days)."""
        thirty_days_ago = timezone.now() - timezone.timedelta(days=30)
        return self.last_active_at >= thirty_days_ago


class PushNotification(models.Model):
    """Model to track sent push notifications."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('delivered', 'Delivered'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    # Notification content
    title = models.CharField(max_length=200)
    body = models.TextField()
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data to send with the notification"
    )

    # Related models
    device = models.ForeignKey(
        Device,
        on_delete=models.CASCADE,
        related_name='push_notifications',
        help_text="Device this notification was sent to"
    )

    # Status tracking
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    expo_ticket_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Expo ticket ID for tracking delivery"
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if notification failed"
    )

    # Timestamps
    sent_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the notification was sent"
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the notification was delivered"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['device']),
            models.Index(fields=['sent_at']),
        ]

    def __str__(self):
        return f"{self.title} -> {self.device.device_name or 'Unknown'} ({self.status})"