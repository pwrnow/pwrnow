from typing import ClassVar
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, RegexValidator
from django.db import models
from django.db.models import EmailField
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from .managers import UserManager
from .utils import generate_username as generate_username_util
import uuid


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