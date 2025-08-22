from typing import ClassVar
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import EmailField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from .managers import UserManager
import uuid


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = EmailField(_("email address"), unique=True)
    username = None  # type: ignore[assignment]

    # Google OAuth fields
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    google_email = models.EmailField(null=True, blank=True)
    profile_picture_url = models.URLField(max_length=500, null=True, blank=True)
    auth_provider = models.CharField(
        max_length=20,
        choices=[('email', 'Email'), ('google', 'Google')],
        default='email'
    )
    is_google_verified = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects: ClassVar[UserManager] = UserManager()

    def get_absolute_url(self) -> str:
        """Get URL for user's detail view.

        Returns:
            str: URL for user detail.

        """
        return reverse("users:detail", kwargs={"pk": self.id})

    def get_full_name(self) -> str:
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()

    def is_google_user(self) -> bool:
        """Check if user signed up using Google OAuth."""
        return self.auth_provider == 'google' and bool(self.google_id)

    def has_profile_picture(self) -> bool:
        """Check if user has a profile picture."""
        return bool(self.profile_picture_url)