import uuid
from django.db.models import Q
import secrets
import os
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.conf import settings
from sqids import Sqids
from django.utils.translation import gettext_lazy as _


def generate_organization_code():
    """Generate a unique 12-character code using sqids."""
    sqids = Sqids(min_length=12)
    # Generate a random number to encode
    random_number = secrets.randbits(32)  # 32-bit random number
    return sqids.encode([random_number])


def upload_to_uuid_filename(directory):
    """Generate a callable that creates UUID-based filenames for a given directory.

    Args:
        directory: The directory name where files should be stored

    Returns:
        A callable suitable for use as ImageField.upload_to
    """
    def upload_handler(instance, filename):
        """Generate UUID-based filename preserving original extension."""
        ext = os.path.splitext(filename)[1]
        filename = f"{uuid.uuid4()}{ext}"
        return os.path.join(directory, filename)
    return upload_handler


# Create upload handlers for each model
upload_to_organization_image = upload_to_uuid_filename('organizations')
upload_to_event_image = upload_to_uuid_filename('events')
upload_to_post_image = upload_to_uuid_filename('posts')
upload_to_event_map_location_image = upload_to_uuid_filename('event_map_locations')


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
        upload_to=upload_to_organization_image,
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

    class CodeType(models.TextChoices):
        ORGANIZATION = 'organization', _('Organization')
        ADMIN = 'admin', _('Admin')

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
    type = models.CharField(
        max_length=20,
        choices=CodeType.choices,
        default=CodeType.ORGANIZATION,
        db_index=True,
        help_text="Type of organization code: Organization codes are for organization users, Admin codes are for system administrators"
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
    publication_date = models.DateField(
        db_index=True,
        help_text="Date when the event will be published and appear on the website. Notifications are sent on this date at 9 AM."
    )

    # Media and external links
    image = models.ImageField(
        upload_to=upload_to_event_image,
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
        max_length=1000,
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
    verified_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True, db_index=True,
        related_name='verified_events',
        help_text="User who verified this event"
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
            # Optimized index for the most common list query pattern
            models.Index(
                fields=['verified', 'publication_date', 'ends_at', 'starts_at'],
                name='event_list_query_idx'
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
    def public_url(self):
        """Get the public-facing URL for this event, suitable for notifications and sharing."""
        from django.conf import settings
        return f"{settings.SITE_URL}/wydarzenia/{self.slug}"

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
        """Check if the event was published in the last 24 hours."""
        if not self.publication_date:
            return False
        today = timezone.now().date()
        return (today - self.publication_date).days < 1

    @property
    def duration(self):
        """Get event duration as timedelta."""
        return self.ends_at - self.starts_at

    def get_verified_by_display(self):
        """Get a display-friendly string for who verified this event."""
        if self.verified_by:
            return f"{self.verified_by.get_full_name()} ({self.verified_by.username})"
        return "Not verified"

    @property
    def is_published(self):
        """Check if the event is published (publication date has passed)."""
        if not self.publication_date:
            return False
        today = timezone.now().date()
        return self.publication_date <= today

    @property
    def likes_count(self):
        """Get the total number of likes for this event."""
        return self.likes.count()


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


class Post(models.Model):
    """Posts attached to events, created by organizations with verification support."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    text = models.TextField(blank=True, null=True, help_text=_('Optional text content'))

    # Verification flags mirroring Event
    verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text=_('Timestamp of when the post was verified')
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', '-created_at']),
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['verified', '-created_at']),
        ]

    def __str__(self):
        preview = (self.text or '').strip()[:40]
        return f"Post for {self.event.title}: {preview}"

    def clean(self):
        # Ensure at least text or one image exists; allow initial create to pass
        # so that admin inlines can attach images after the parent saves.
        if self._state.adding:
            return
        if not (self.text and self.text.strip()) and not self.images.exists():
            raise ValidationError(_('Post must include text or at least one image.'))

    @property
    def public_url(self):
        """Get the public-facing URL for this post, suitable for notifications and sharing."""
        return f"{self.event.public_url}/posts/{self.id}"

    def save(self, *args, **kwargs):
        is_new_instance = self._state.adding
        if not is_new_instance:
            try:
                original = Post.objects.get(pk=self.pk)
                if self.verified and not original.verified:
                    self.verified_at = timezone.now()
                elif not self.verified:
                    self.verified_at = None
            except Post.DoesNotExist:
                if self.verified:
                    self.verified_at = timezone.now()
        else:
            if self.verified:
                self.verified_at = timezone.now()
        super().save(*args, **kwargs)


class PostImage(models.Model):
    """Image attachments for posts."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to=upload_to_post_image, help_text=_('Image file'))
    aspect_ratio = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        help_text=_("Detected aspect ratio of the post image (e.g., '16:9', '1:1')")
    )
    order_index = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ['order_index', 'created_at']
        indexes = [
            models.Index(fields=['post', 'order_index']),
        ]

    def __str__(self):
        return f"PostImage(post={self.post_id})"


class Schedule(models.Model):
    """A schedule attached one-to-one to an event."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    event = models.OneToOneField(
        Event,
        on_delete=models.CASCADE,
        related_name='schedule'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Schedule(event={self.event.slug})"


class ScheduleItem(models.Model):
    """Items belonging to a schedule for specific dates with start/end times.

    Note: We intentionally do not store any speaker information.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.CASCADE,
        related_name='items'
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['date', 'start_time']
        indexes = [
            models.Index(fields=['schedule', 'date', 'start_time']),
        ]

    def __str__(self):
        return f"{self.title} on {self.date} at {self.start_time}"

    @property
    def duration_minutes(self):
        from datetime import datetime
        start_dt = datetime.combine(self.date, self.start_time)
        end_dt = datetime.combine(self.date, self.end_time)
        delta = end_dt - start_dt
        return max(0, int(delta.total_seconds() // 60))


class QRCode(models.Model):
    """QR codes for event participation confirmation."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='qr_codes'
    )
    name = models.CharField(
        max_length=100,
        help_text="Human-readable name for this QR code (e.g., 'Entrance Gate A', 'VIP Check-in')"
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique code that will be encoded in the QR code"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this QR code is currently active and can be scanned"
    )
    usage_count = models.PositiveIntegerField(
        default=0,
        help_text="Number of times this QR code has been scanned"
    )
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text="When this QR code was last scanned"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'is_active']),
            models.Index(fields=['code']),
            models.Index(fields=['last_used_at']),
        ]

    def __str__(self):
        return f"{self.event.title} - {self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if not self.code:
            # Generate a unique code if not provided
            import secrets
            import string
            while True:
                self.code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
                if not QRCode.objects.filter(code=self.code).exists():
                    break
        super().save(*args, **kwargs)


class EventParticipation(models.Model):
    """Track user participation confirmations for events."""

    class ParticipationType(models.TextChoices):
        QR_SCAN = 'qr_scan', _('QR Code Scan')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='event_participations'
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participations'
    )
    qr_code = models.ForeignKey(
        QRCode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='participations',
        help_text="QR code that was scanned (if applicable)"
    )
    participation_type = models.CharField(
        max_length=30,
        choices=ParticipationType.choices,
        default=ParticipationType.QR_SCAN,
        help_text="Type of participation confirmation"
    )
    confirmed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the participation was confirmed"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about the participation confirmation"
    )

    class Meta:
        unique_together = (('user', 'event'),)
        ordering = ['-confirmed_at']
        indexes = [
            models.Index(fields=['user', 'event']),
            models.Index(fields=['event', 'confirmed_at']),
            models.Index(fields=['participation_type', 'confirmed_at']),
            models.Index(fields=['qr_code', 'confirmed_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.event.title} ({self.get_participation_type_display()})"


class EventMap(models.Model):
    """Maps associated with events to show multiple locations."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    event = models.OneToOneField(
        Event,
        on_delete=models.CASCADE,
        related_name='event_map',
        help_text="Event this map belongs to"
    )
    title = models.CharField(
        max_length=200,
        help_text="Title for the event map (e.g., 'Event Locations', 'Campus Map')"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of the map"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this map is active and should be displayed"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event', 'is_active']),
        ]

    def __str__(self):
        return f"Map for {self.event.title}"

    @property
    def locations_count(self):
        """Get the total number of locations on this map."""
        return self.locations.count()


class EventMapLocation(models.Model):
    """Individual locations on an event map."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    event_map = models.ForeignKey(
        EventMap,
        on_delete=models.CASCADE,
        related_name='locations'
    )
    name = models.CharField(
        max_length=200,
        help_text="Name of the location (e.g., 'Main Auditorium', 'Building A')"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of this location"
    )
    latitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        help_text="Latitude coordinate"
    )
    longitude = models.DecimalField(
        max_digits=10,
        decimal_places=7,
        help_text="Longitude coordinate"
    )
    address = models.CharField(
        max_length=300,
        blank=True,
        null=True,
        help_text="Human-readable address of this location"
    )
    order_index = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Order for displaying locations"
    )
    image = models.ImageField(
        upload_to=upload_to_event_map_location_image,
        blank=True,
        null=True,
        help_text="Custom marker image for this location"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this location is active and should be displayed"
    )

    class Meta:
        ordering = ['order_index', 'name']
        indexes = [
            models.Index(fields=['event_map', 'order_index']),
            models.Index(fields=['event_map', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.event_map.event.title})"

    def clean(self):
        """Validate latitude and longitude values."""
        if self.latitude is not None:
            if self.latitude < -90 or self.latitude > 90:
                raise ValidationError("Latitude must be between -90 and 90 degrees.")
        if self.longitude is not None:
            if self.longitude < -180 or self.longitude > 180:
                raise ValidationError("Longitude must be between -180 and 180 degrees.")


class Friendship(models.Model):
    """Represents an accepted friendship between two users (bidirectional relationship)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    # Both users in the friendship (order doesn't matter)
    user1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='friendships_as_user1'
    )
    user2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='friendships_as_user2'
    )

    class Meta:
        unique_together = (('user1', 'user2'),)
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user1', 'created_at']),
            models.Index(fields=['user2', 'created_at']),
        ]

    def __str__(self):
        return f"Friendship: {self.user1.username} - {self.user2.username}"

    def clean(self):
        """Ensure users are different and maintain consistent ordering."""
        import logging
        logger = logging.getLogger(__name__)

        logger.debug(f"FRIENDS_MODEL_FRIENDSHIP_CLEAN: Cleaning friendship between {self.user1.username} and {self.user2.username}")

        if self.user1 == self.user2:
            logger.error(f"FRIENDS_MODEL_FRIENDSHIP_CLEAN_ERROR: User {self.user1.username} cannot be friends with themselves")
            raise ValidationError("Users cannot be friends with themselves.")

        # Ensure user1.id < user2.id for consistent ordering
        if self.user1.id > self.user2.id:
            logger.debug(f"FRIENDS_MODEL_FRIENDSHIP_CLEAN_REORDER: Reordering users for consistent ordering")
            self.user1, self.user2 = self.user2, self.user1

    def save(self, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)

        is_new = self.pk is None
        logger.info(f"FRIENDS_MODEL_FRIENDSHIP_SAVE: {'Creating' if is_new else 'Updating'} friendship between {self.user1.username} and {self.user2.username}")

        self.clean()
        super().save(*args, **kwargs)

        if is_new:
            logger.info(f"FRIENDS_MODEL_FRIENDSHIP_SAVE_SUCCESS: Friendship {self.id} created between {self.user1.username} and {self.user2.username}")
        else:
            logger.info(f"FRIENDS_MODEL_FRIENDSHIP_SAVE_SUCCESS: Friendship {self.id} updated between {self.user1.username} and {self.user2.username}")

    def delete(self, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"FRIENDS_MODEL_FRIENDSHIP_DELETE: Deleting friendship {self.id} between {self.user1.username} and {self.user2.username}")

        # Clean up any friend requests between these users before deleting the friendship
        friend_requests = FriendRequest.objects.filter(
            models.Q(from_user=self.user1, to_user=self.user2) |
            models.Q(from_user=self.user2, to_user=self.user1)
        )

        if friend_requests.exists():
            logger.info(f"FRIENDS_MODEL_FRIENDSHIP_DELETE_CLEANUP: Found {friend_requests.count()} friend request(s) to clean up between {self.user1.username} and {self.user2.username}")
            friend_requests.delete()
            logger.info(f"FRIENDS_MODEL_FRIENDSHIP_DELETE_CLEANUP_SUCCESS: Successfully deleted friend requests between {self.user1.username} and {self.user2.username}")

        super().delete(*args, **kwargs)
        logger.info(f"FRIENDS_MODEL_FRIENDSHIP_DELETE_SUCCESS: Friendship {self.id} deleted successfully")


class FriendRequest(models.Model):
    """Represents a pending friend request from one user to another."""

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        ACCEPTED = 'accepted', _('Accepted')
        REJECTED = 'rejected', _('Rejected')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    # User who sent the request
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_friend_requests'
    )

    # User who received the request
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_friend_requests'
    )

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )

    class Meta:
        unique_together = (('from_user', 'to_user'),)
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"Friend Request: {self.from_user.username} -> {self.to_user.username} ({self.status})"

    def clean(self):
        """Validate that users are different."""
        import logging
        logger = logging.getLogger(__name__)

        logger.debug(f"FRIENDS_MODEL_FRIEND_REQUEST_CLEAN: Cleaning friend request from {self.from_user.username} to {self.to_user.username}")

        if self.from_user == self.to_user:
            logger.error(f"FRIENDS_MODEL_FRIEND_REQUEST_CLEAN_ERROR: User {self.from_user.username} cannot send friend request to themselves")
            raise ValidationError("Users cannot send friend requests to themselves.")

    def save(self, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)

        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_instance = FriendRequest.objects.get(pk=self.pk)
                old_status = old_instance.status
            except FriendRequest.DoesNotExist:
                pass

        logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_SAVE: {'Creating' if is_new else 'Updating'} friend request from {self.from_user.username} to {self.to_user.username}")
        if not is_new and old_status != self.status:
            logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_SAVE_STATUS_CHANGE: Status changed from {old_status} to {self.status}")

        self.clean()
        super().save(*args, **kwargs)

        if is_new:
            logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_SAVE_SUCCESS: Friend request {self.id} created from {self.from_user.username} to {self.to_user.username} with status {self.status}")
        else:
            logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_SAVE_SUCCESS: Friend request {self.id} updated from {self.from_user.username} to {self.to_user.username} with status {self.status}")

    def delete(self, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_DELETE: Deleting friend request {self.id} from {self.from_user.username} to {self.to_user.username}")
        super().delete(*args, **kwargs)
        logger.info(f"FRIENDS_MODEL_FRIEND_REQUEST_DELETE_SUCCESS: Friend request {self.id} deleted successfully")
