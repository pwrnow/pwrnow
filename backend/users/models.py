from typing import ClassVar
import os
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.db.models import EmailField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from .managers import UserManager
from .utils import generate_username as generate_username_util
import uuid


def upload_to_profile_image(instance, filename):
    """Generate UUID-based filename for user profile images."""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('profile_images', filename)


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = EmailField(_("email address"), unique=True)

    # Custom username field with validation
    username = models.CharField(
        _("username"),
        max_length=16,
        unique=True,
        validators=[
            MinLengthValidator(3, _("Username must be at least 3 characters long")),
            RegexValidator(
                regex=r'^[a-zA-Z0-9_]+$',
                message=_("Username can only contain letters, numbers, and underscores")
            )
        ],
        help_text=_("Required. 3-16 characters. Letters, numbers, and underscores only.")
    )

    # Track if username has been manually set by user (for one-time change restriction)
    username_set_by_user = models.BooleanField(
        _("username set by user"),
        default=False,
        help_text=_("Indicates if the user has manually set their username")
    )

    # Profile image - only set upon approval of a ProfileImageChangeRequest
    profile_image = models.ImageField(
        upload_to=upload_to_profile_image,
        blank=True,
        null=True,
        help_text=_("User profile image (approved)")
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: ClassVar[UserManager] = UserManager()

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"pk": self.id})

    def generate_username(self) -> str:
        """Generate a username based on first name, last name, or email.

        Returns:
            str: Generated username
        """
        # Use shared utility function
        return generate_username_util(
            first_name=self.first_name or '',
            last_name=self.last_name or '',
            email=self.email or '',
            user_id=self.id,
            existing_usernames=lambda username: User.objects.filter(username=username).exists()
        )

    def __str__(self):
        """Return username for string representation."""
        return self.username

    def save(self, *args, **kwargs):
        """Override save to auto-generate username if not provided"""
        if not self.username:
            self.username = self.generate_username()
        super().save(*args, **kwargs)

    @property
    def pending_profile_image_request(self):
        """Return the user's latest pending profile image change request."""
        return self.profile_image_requests.filter(
            status=ProfileImageChangeRequest.Status.PENDING
        ).order_by('-created_at').first()


def upload_to_profile_image_request(instance, filename):
    """Generate UUID-based filename for profile image change request images."""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('profile_image_requests', filename)


class ProfileImageChangeRequest(models.Model):
    """Track profile image change requests requiring staff approval."""

    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='profile_image_requests'
    )
    image = models.ImageField(
        upload_to=upload_to_profile_image_request,
        help_text=_("Pending profile image awaiting approval")
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    rejection_feedback = models.TextField(
        blank=True,
        null=True,
        help_text=_("Feedback provided when rejecting the image")
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_profile_image_requests',
        help_text=_("Staff member who reviewed this request")
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
        ]

    def __str__(self):
        return f"ProfileImageChangeRequest({self.user.username}, {self.status})"