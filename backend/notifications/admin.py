from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Device, PushNotification


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'device_name',
        'platform',
        'preferred_language',
        'notifications_enabled',
        'is_active_display',
        'created_at',
        'last_active_at',
    ]
    list_filter = [
        'platform',
        'notifications_enabled',
        'preferred_language',
        'created_at',
        'last_active_at',
    ]
    search_fields = [
        'user__email',
        'user__username',
        'device_name',
        'expo_push_token',
        'app_version',
    ]
    list_select_related = ['user']
    raw_id_fields = ['user']
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'last_active_at',
    ]


    fieldsets = (
        ('Basic Information', {
            'fields': (
                'id',
                'user',
                'expo_push_token',
                'device_name',
                'platform',
                'app_version',
            )
        }),
        ('Preferences', {
            'fields': (
                'notifications_enabled',
                'preferred_language',
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
                'last_active_at',
            )
        }),
    )

    def is_active_display(self, obj):
        """Display if device is active with colored indicator."""
        if obj.is_active():
            return format_html(
                '<span style="color: green;">✓ Active</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">✗ Inactive</span>'
            )
    is_active_display.short_description = 'Status'



    actions = ['send_test_notification', 'mark_inactive_devices']

    def send_test_notification(self, request, queryset):
        """Send test notification to selected devices."""
        from .tasks import send_test_notification

        success_count = 0
        for device in queryset:
            if device.notifications_enabled and device.is_active():
                send_test_notification.delay(
                    str(device.id),
                    "Test from Admin",
                    f"Test notification sent at {timezone.now().strftime('%H:%M:%S')}"
                )
                success_count += 1

        self.message_user(
            request,
            f"Test notifications queued for {success_count} devices"
        )
    send_test_notification.short_description = "Send test notification to selected devices"

    def mark_inactive_devices(self, request, queryset):
        """Mark selected devices as having notifications disabled."""
        updated = queryset.update(notifications_enabled=False)
        self.message_user(
            request,
            f"Disabled notifications for {updated} devices"
        )
    mark_inactive_devices.short_description = "Disable notifications for selected devices"


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title',
        'device_display',
        'status',
        'created_at',
        'sent_at',
        'delivered_at',
    ]
    list_filter = [
        'status',
        'created_at',
        'sent_at',
        'device__platform',
    ]
    search_fields = [
        'title',
        'body',
        'device__device_name',
    ]
    readonly_fields = [
        'id',
        'created_at',
        'updated_at',
        'sent_at',
        'delivered_at',
        'expo_ticket_id',
    ]

    fieldsets = (
        ('Content', {
            'fields': (
                'title',
                'body',
                'data',
            )
        }),
        ('Related Objects', {
            'fields': (
                'device',
            )
        }),
        ('Status', {
            'fields': (
                'status',
                'expo_ticket_id',
                'error_message',
            )
        }),
        ('Timestamps', {
            'fields': (
                'id',
                'created_at',
                'updated_at',
                'sent_at',
                'delivered_at',
            )
        }),
    )

    def device_display(self, obj):
        """Display device name with link."""
        if obj.device:
            url = reverse('admin:notifications_device_change', args=[obj.device.id])
            return format_html(
                '<a href="{}">{}</a>',
                url,
                obj.device.device_name or 'Unknown Device'
            )
        return '-'
    device_display.short_description = 'Device'



    actions = ['retry_failed_notifications']

    def retry_failed_notifications(self, request, queryset):
        """Retry failed notifications."""
        failed_notifications = queryset.filter(status='failed')

        for notification in failed_notifications:
            # Reset notification status
            notification.status = 'pending'
            notification.error_message = None
            notification.save()

        self.message_user(
            request,
            f"Reset {failed_notifications.count()} failed notifications to pending"
        )
    retry_failed_notifications.short_description = "Reset failed notifications to pending"