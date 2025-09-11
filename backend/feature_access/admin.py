from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Feature, EventFeatureAccess


@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ["display_name", "name", "is_active", "created_at"]
    list_filter = ["is_active", "created_at"]
    search_fields = ["name", "display_name", "description"]
    list_editable = ["is_active"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        (
            _("Basic Information"),
            {"fields": ("id", "name", "display_name", "description")},
        ),
        (_("Status"), {"fields": ("is_active",)}),
        (
            _("Timestamps"),
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(EventFeatureAccess)
class EventFeatureAccessAdmin(admin.ModelAdmin):
    list_display = [
        "event_name",
        "organization_name",
        "feature_name",
        "is_enabled",
        "enabled_at",
        "enabled_by",
        "created_at",
    ]
    list_filter = [
        "is_enabled",
        "feature__is_active",
        "feature__display_name",
        "event__organization",
        "enabled_at",
        "created_at",
    ]
    search_fields = [
        "event__title",
        "event__slug",
        "event__organization__name",
        "feature__name",
        "feature__display_name",
        "enabled_by__email",
    ]
    list_editable = ["is_enabled"]
    readonly_fields = ["id", "created_at", "updated_at", "enabled_at"]
    autocomplete_fields = ["event", "feature", "enabled_by"]

    fieldsets = (
        (_("Access Control"), {"fields": ("event", "feature", "is_enabled")}),
        (
            _("Enabling Information"),
            {"fields": ("enabled_by", "enabled_at"), "classes": ("collapse",)},
        ),
        (
            _("Timestamps"),
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def event_name(self, obj):
        """Display event name with link to event admin."""
        url = reverse("admin:core_event_change", args=[obj.event.id])
        return format_html('<a href="{}">{}</a>', url, obj.event.title)

    event_name.short_description = _("Event")
    event_name.admin_order_field = "event__title"

    def organization_name(self, obj):
        """Display organization name with link to organization admin."""
        url = reverse(
            "admin:core_organization_change", args=[obj.event.organization.id]
        )
        return format_html('<a href="{}">{}</a>', url, obj.event.organization.name)

    organization_name.short_description = _("Organization")
    organization_name.admin_order_field = "event__organization__name"

    def feature_name(self, obj):
        """Display feature name with link to feature admin."""
        url = reverse("admin:feature_access_feature_change", args=[obj.feature.id])
        return format_html('<a href="{}">{}</a>', url, obj.feature.display_name)

    feature_name.short_description = _("Feature")
    feature_name.admin_order_field = "feature__display_name"

    def save_model(self, request, obj, form, change):
        """Set the enabled_by field when saving."""
        if not change and obj.is_enabled:  # New object being enabled
            obj.enabled_by = request.user
        elif change:
            if obj.is_enabled and not obj.enabled_by:  # Existing object being enabled
                obj.enabled_by = request.user
            elif not obj.is_enabled:  # Object being disabled
                obj.enabled_by = None
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return (
            super()
            .get_queryset(request)
            .select_related("event", "event__organization", "feature", "enabled_by")
        )

    def save_formset(self, request, form, formset, change):
        """Handle bulk editing from list view."""
        instances = formset.save(commit=False)
        for instance in instances:
            if hasattr(instance, "is_enabled"):
                if instance.is_enabled and not instance.enabled_by:
                    instance.enabled_by = request.user
                elif not instance.is_enabled:
                    instance.enabled_by = None
            instance.save()
        formset.save_m2m()
