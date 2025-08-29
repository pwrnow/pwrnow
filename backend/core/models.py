import uuid
from django.db.models import Q
import secrets
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.conf import settings
from sqids import Sqids


def generate_organization_code():
    """Generate a unique 12-character code using sqids."""
    sqids = Sqids(min_length=12)
    # Generate a random number to encode
    random_number = secrets.randbits(32)  # 32-bit random number
    return sqids.encode([random_number])


class Category(models.Model):
    """Event categories with slugs for SEO-friendly URLs."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    order_index = models.PositiveIntegerField(
        default=0,
        help_text="Used for ordering categories in displays"
    )

    class Meta:
        verbose_name_plural = "categories"
        ordering = ['order_index', 'name']
        indexes = [
            models.Index(fields=['order_index', 'name'], name='category_order_name_idx'),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('category-detail', kwargs={'slug': self.slug})


class Tag(models.Model):
    """Tags for events to enable flexible categorization."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, db_index=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('tag-detail', kwargs={'slug': self.slug})


class Organization(models.Model):
    """Organizations that can host events."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    image = models.ImageField(
        upload_to='organizations/',
        blank=True,
        null=True,
        help_text="Organization logo/image"
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('organization-detail', kwargs={'slug': self.slug})


class OrganizationCode(models.Model):
    """Authentication codes/links for organizations to verify their ownership."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When this organization code was last used for authentication"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='auth_codes'
    )
    code = models.CharField(
        max_length=12,
        unique=True,
        default=generate_organization_code,
        help_text="Auto-generated unique authentication code"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.organization.name} - {self.code}"


class Event(models.Model):
    """Events with comprehensive metadata and relationships."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)

    # Timing
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(db_index=True)

    # Media and external links
    image = models.ImageField(
        upload_to='events/',
        blank=True,
        null=True,
        help_text="Event image/poster"
    )
    aspect_ratio = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text="Detected aspect ratio of the event image (e.g., '16:9', '1:1')"
    )
    url = models.URLField(
        blank=True,
        null=True,
        validators=[URLValidator()],
        help_text="External event URL"
    )

    # Location
    location = models.CharField(max_length=300, blank=True, null=True)

    # Relationships
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='events'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='events'
    )
    tags = models.ManyToManyField(
        Tag,
        blank=True,
        related_name='events',
        help_text="Tags for flexible event categorization"
    )

    # Status flags
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        help_text="Timestamp of when the event was verified"
    )

    class Meta:
        ordering = ['starts_at']
        indexes = [
            models.Index(fields=['starts_at', 'ends_at']),
            models.Index(fields=['verified']),
            models.Index(fields=['verified_at']),
            models.Index(fields=['category', 'starts_at']),
            models.Index(fields=['organization', 'starts_at']),
            models.Index(fields=['verified', 'ends_at', 'starts_at'], name='event_verified_ends_start_idx'),
            models.Index(
                fields=['ends_at', 'starts_at'],
                name='event_public_time_idx',
                condition=Q(verified=True),
            ),
        ]

    def __str__(self):
        return f"{self.title} - {self.starts_at.strftime('%Y-%m-%d %H:%M')}"

    def clean(self):
        """Validate that end time is after start time."""
        if self.starts_at and self.ends_at and self.ends_at <= self.starts_at:
            raise ValidationError("End time must be after start time.")

    def save(self, *args, **kwargs):
        is_new_instance = self._state.adding
        if not is_new_instance:
            try:
                original = Event.objects.get(pk=self.pk)
                if self.verified and not original.verified:
                    self.verified_at = timezone.now()
                elif not self.verified:
                    self.verified_at = None
            except Event.DoesNotExist:
                if self.verified:
                    self.verified_at = timezone.now()
        else:
            if self.verified:
                self.verified_at = timezone.now()

        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Event.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('event-detail', kwargs={'slug': self.slug})

    @property
    def is_past(self):
        """Check if event has ended."""
        return timezone.now() > self.ends_at

    @property
    def is_ongoing(self):
        """Check if event is currently happening."""
        now = timezone.now()
        return self.starts_at <= now <= self.ends_at

    @property
    def is_upcoming(self):
        """Check if event is in the future."""
        return timezone.now() < self.starts_at

    def check_is_new(self):
        """Check if the event was verified in the last 24 hours."""
        if not self.verified_at:
            return False
        return timezone.now() - self.verified_at < timezone.timedelta(days=1)

    @property
    def duration(self):
        """Get event duration as timedelta."""
        return self.ends_at - self.starts_at


class Like(models.Model):
    """User likes for events."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='likes'
    )

    class Meta:
        unique_together = (('user', 'event'),)
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'event']),
            models.Index(fields=['event', 'user']),
        ]

    def __str__(self):
        return f"Like(user={self.user_id}, event={self.event_id})"
