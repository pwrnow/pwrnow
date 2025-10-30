from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils import timezone
from django.shortcuts import render, redirect
from django.contrib import messages
from django.http import HttpResponseRedirect
from django import forms
from django.contrib.admin.views.main import ChangeList
from .models import Device, PushNotification
from .services import push_service
from .tasks import send_test_notification


class CustomNotificationForm(forms.Form):
    """Form for sending custom notifications through admin panel."""

    title = forms.CharField(
        max_length=200,
        required=True,
        help_text="Notification title (max 200 characters)",
    )

    body = forms.CharField(
        widget=forms.Textarea(attrs={"rows": 4}),
        required=True,
        help_text="Notification message body",
    )

    subtitle = forms.CharField(
        max_length=100,
        required=False,
        help_text="Optional subtitle (iOS only, max 100 characters)",
    )

    include_deep_link = forms.BooleanField(
        required=False,
        initial=False,
        help_text="Include deep link to latest event (if available)",
    )


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "device_name",
        "platform",
        "preferred_language",
        "notifications_enabled",
        "is_active_display",
        "app_version",
        "created_at",
        "last_active_at",
    ]
    list_filter = [
        "platform",
        "notifications_enabled",
        "preferred_language",
        "created_at",
        "last_active_at",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "device_name",
        "expo_push_token",
        "app_version",
    ]
    list_select_related = ["user"]
    raw_id_fields = ["user"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "last_active_at",
    ]
    date_hierarchy = 'created_at'
    ordering = ['-last_active_at', '-created_at']

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "id",
                    "user",
                    "expo_push_token",
                    "device_name",
                    "platform",
                    "app_version",
                )
            },
        ),
        (
            "Preferences",
            {
                "fields": (
                    "notifications_enabled",
                    "preferred_language",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "last_active_at",
                )
            },
        ),
    )

    def is_active_display(self, obj):
        """Display if device is active with colored indicator."""
        if obj.is_active():
            return format_html('<span style="color: green;">✓ Active</span>')
        else:
            return format_html('<span style="color: red;">✗ Inactive</span>')

    is_active_display.short_description = "Status"

    actions = [
        "send_test_notification",
        "send_custom_text_notification",
        "send_custom_broadcast_notification",
        "disable_notifications",
    ]

    def send_test_notification(self, request, queryset):
        """Send test notification to selected devices."""
        from .tasks import send_test_notification

        success_count = 0
        for device in queryset:
            if device.notifications_enabled and device.is_active():
                send_test_notification.delay(
                    str(device.id),
                    "Test from Admin",
                    f"Test notification sent at {timezone.now().strftime('%H:%M:%S')}",
                )
                success_count += 1

        self.message_user(
            request, f"Test notifications queued for {success_count} devices"
        )

    send_test_notification.short_description = (
        "Send test notification to selected devices"
    )

    def send_custom_text_notification(self, request, queryset):
        """Send custom text notification to selected devices with form."""
        # Filter to only active devices with notifications enabled
        active_devices = queryset.filter(notifications_enabled=True)

        if not active_devices.exists():
            self.message_user(
                request,
                "No active devices with notifications enabled found in selection.",
                level=messages.WARNING,
            )
            return

        # If this is a POST request, process the form
        if request.POST.get("apply"):
            form = CustomNotificationForm(request.POST)
            if form.is_valid():
                title = form.cleaned_data["title"]
                body = form.cleaned_data["body"]
                subtitle = form.cleaned_data.get("subtitle")
                include_deep_link = form.cleaned_data["include_deep_link"]

                # Get latest event for deep linking if requested
                event_data = None
                if include_deep_link:
                    from core.models import Event

                    latest_event = (
                        Event.objects.filter(verified=True, ends_at__gte=timezone.now())
                        .order_by("-verified_at", "starts_at")
                        .first()
                    )

                    if latest_event:
                        event_data = {
                            "event_id": str(latest_event.id),
                            "event_slug": latest_event.slug,
                            "category_slug": (
                                latest_event.category.slug
                                if latest_event.category
                                else None
                            ),
                            "organization_slug": (
                                latest_event.organization.slug
                                if latest_event.organization
                                else None
                            ),
                            "url": latest_event.public_url,
                        }

                # Prepare notification data
                data = {
                    "type": "admin_custom",
                    "timestamp": timezone.now().isoformat(),
                    "admin_sent": True,
                }

                if event_data:
                    data.update(event_data)

                # Send notifications
                success_count = 0
                failed_count = 0

                for device in active_devices:
                    try:
                        success = push_service.send_notification_to_device(
                            device=device,
                            title=title,
                            body=body,
                            subtitle=subtitle if subtitle else None,
                            data=data,
                        )
                        if success:
                            success_count += 1
                        else:
                            failed_count += 1
                    except Exception as e:
                        failed_count += 1
                        print(f"Error sending to device {device.id}: {e}")

                # Show results
                if success_count > 0:
                    self.message_user(
                        request,
                        f"Custom notification sent successfully to {success_count} devices. "
                        f"{failed_count} devices failed.",
                        level=(
                            messages.SUCCESS if failed_count == 0 else messages.WARNING
                        ),
                    )
                else:
                    self.message_user(
                        request,
                        f"Failed to send notification to any devices. {failed_count} devices failed.",
                        level=messages.ERROR,
                    )

                return None  # This will redirect back to the changelist
            else:
                # Form has validation errors, show them
                pass
        else:
            # Show the form
            form = CustomNotificationForm()

        # Prepare context for the template
        context = {
            "form": form,
            "devices": active_devices,
            "device_count": active_devices.count(),
            "title": "Send Custom Text Notification",
            "action_name": "send_custom_text_notification",
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": "_selected_action",
        }

        return render(
            request, "admin/notifications/custom_text_notification_form.html", context
        )

    send_custom_text_notification.short_description = (
        "Send custom notification to selected devices"
    )

    def send_custom_broadcast_notification(self, request, queryset):
        """Send custom text notification to ALL active devices with form."""
        # Get all active devices with notifications enabled
        all_active_devices = Device.objects.filter(
            notifications_enabled=True,
            last_active_at__gte=timezone.now() - timezone.timedelta(days=30),
        )

        if not all_active_devices.exists():
            self.message_user(
                request,
                "No active devices with notifications enabled found.",
                level=messages.WARNING,
            )
            return

        # If this is a POST request, process the form
        if request.POST.get("apply"):
            form = CustomNotificationForm(request.POST)
            if form.is_valid():
                title = form.cleaned_data["title"]
                body = form.cleaned_data["body"]
                subtitle = form.cleaned_data.get("subtitle")
                include_deep_link = form.cleaned_data["include_deep_link"]

                # Get latest event for deep linking if requested
                event_data = None
                if include_deep_link:
                    from core.models import Event

                    latest_event = (
                        Event.objects.filter(verified=True, ends_at__gte=timezone.now())
                        .order_by("-verified_at", "starts_at")
                        .first()
                    )

                    if latest_event:
                        event_data = {
                            "event_id": str(latest_event.id),
                            "event_slug": latest_event.slug,
                            "category_slug": (
                                latest_event.category.slug
                                if latest_event.category
                                else None
                            ),
                            "organization_slug": (
                                latest_event.organization.slug
                                if latest_event.organization
                                else None
                            ),
                            "url": latest_event.public_url,
                        }

                # Prepare notification data
                data = {
                    "type": "admin_broadcast",
                    "timestamp": timezone.now().isoformat(),
                    "admin_sent": True,
                }

                if event_data:
                    data.update(event_data)

                # Send notifications to ALL active devices
                success_count = 0
                failed_count = 0

                for device in all_active_devices:
                    try:
                        success = push_service.send_notification_to_device(
                            device=device,
                            title=title,
                            body=body,
                            subtitle=subtitle if subtitle else None,
                            data=data,
                        )
                        if success:
                            success_count += 1
                        else:
                            failed_count += 1
                    except Exception as e:
                        failed_count += 1
                        print(f"Error sending to device {device.id}: {e}")

                # Show results
                if success_count > 0:
                    self.message_user(
                        request,
                        f"Broadcast notification sent successfully to {success_count} devices. "
                        f"{failed_count} devices failed.",
                        level=(
                            messages.SUCCESS if failed_count == 0 else messages.WARNING
                        ),
                    )
                else:
                    self.message_user(
                        request,
                        f"Failed to send notification to any devices. {failed_count} devices failed.",
                        level=messages.ERROR,
                    )

                return None  # This will redirect back to the changelist
            else:
                # Form has validation errors, show them
                pass
        else:
            # Show the form
            form = CustomNotificationForm()

        # Prepare context for the template
        context = {
            "form": form,
            "devices": all_active_devices,
            "device_count": all_active_devices.count(),
            "title": "Send Custom Broadcast Notification",
            "action_name": "send_custom_broadcast_notification",
            "queryset": queryset,
            "opts": self.model._meta,
            "action_checkbox_name": "_selected_action",
            "is_broadcast": True,
        }

        return render(
            request, "admin/notifications/custom_text_notification_form.html", context
        )

    send_custom_broadcast_notification.short_description = (
        "Send custom notification to ALL active devices"
    )

    def disable_notifications(self, request, queryset):
        """Disable notifications for selected devices."""
        updated_count = queryset.update(notifications_enabled=False)

        self.message_user(
            request,
            f"Disabled notifications for {updated_count} device(s).",
            level=messages.SUCCESS,
        )

    disable_notifications.short_description = (
        "Disable notifications for selected devices"
    )


@admin.register(PushNotification)
class PushNotificationAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "body_preview",
        "device_display",
        "status",
        "created_at",
        "sent_at",
        "delivered_at",
    ]
    list_filter = [
        "status",
        "created_at",
        "sent_at",
        "delivered_at",
        "device__platform",
    ]
    search_fields = [
        "title",
        "body",
        "device__device_name",
        "device__user__username",
        "device__user__email",
    ]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "sent_at",
        "delivered_at",
        "expo_ticket_id",
    ]
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    @admin.display(description='Body')
    def body_preview(self, obj):
        if obj.body:
            from django.utils.text import Truncator
            return Truncator(obj.body).chars(50)
        return "-"

    fieldsets = (
        (
            "Content",
            {
                "fields": (
                    "title",
                    "body",
                    "data",
                )
            },
        ),
        ("Related Objects", {"fields": ("device",)}),
        (
            "Status",
            {
                "fields": (
                    "status",
                    "expo_ticket_id",
                    "error_message",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                    "sent_at",
                    "delivered_at",
                )
            },
        ),
    )

    def device_display(self, obj):
        """Display device name with link."""
        if obj.device:
            url = reverse("admin:notifications_device_change", args=[obj.device.id])
            return format_html(
                '<a href="{}">{}</a>', url, obj.device.device_name or "Unknown Device"
            )
        return "-"

    device_display.short_description = "Device"

    actions = ["retry_failed_notifications"]

    def retry_failed_notifications(self, request, queryset):
        """Retry failed notifications."""
        failed_notifications = queryset.filter(status="failed")

        for notification in failed_notifications:
            # Reset notification status
            notification.status = "pending"
            notification.error_message = None
            notification.save()

        self.message_user(
            request,
            f"Reset {failed_notifications.count()} failed notifications to pending",
        )

    retry_failed_notifications.short_description = (
        "Reset failed notifications to pending"
    )
