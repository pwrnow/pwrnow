import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Event


class Feature(models.Model):
    """Available features that can be enabled/disabled for events."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text=_("Internal name for the feature (e.g., 'magic_parsing')"),
    )
    display_name = models.CharField(
        max_length=200,
        help_text=_("Human-readable name for the feature (e.g., 'Magic Parsing')"),
    )
    description = models.TextField(
        blank=True, help_text=_("Description of what this feature does")
    )
    is_active = models.BooleanField(
        default=True,
        help_text=_("Whether this feature is available for assignment to events"),
    )

    class Meta:
        ordering = ["display_name"]
        verbose_name = _("Feature")
        verbose_name_plural = _("Features")

    def __str__(self):
        return self.display_name


class EventFeatureAccess(models.Model):
    """Controls which features are enabled for specific events."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="feature_access",
        help_text=_("Event that has access to this feature"),
    )
    feature = models.ForeignKey(
        Feature,
        on_delete=models.CASCADE,
        related_name="event_access",
        help_text=_("Feature that is enabled for this event"),
    )
    is_enabled = models.BooleanField(
        default=False,
        help_text=_("Whether this feature is enabled for the event"),
    )
    enabled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("When this feature was enabled for the event"),
    )
    enabled_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="enabled_event_features",
        help_text=_("Admin user who enabled this feature"),
    )

    class Meta:
        unique_together = (("event", "feature"),)
        ordering = ["event__title", "feature__display_name"]
        verbose_name = _("Event Feature Access")
        verbose_name_plural = _("Event Feature Access")
        indexes = [
            models.Index(fields=["event", "feature"]),
            models.Index(fields=["is_enabled"]),
        ]

    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"{self.event.title} - {self.feature.display_name} ({status})"

    def save(self, *args, **kwargs):
        # Set enabled_at timestamp when feature is enabled
        if self.is_enabled and not self.enabled_at:
            from django.utils import timezone

            self.enabled_at = timezone.now()
        elif not self.is_enabled:
            self.enabled_at = None
        super().save(*args, **kwargs)
