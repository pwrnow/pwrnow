from typing import TYPE_CHECKING

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import UserManager as DjangoUserManager

if TYPE_CHECKING:
    from .models import User  # noqa: F401


class UserManager(DjangoUserManager["User"]):
    """Custom manager for the User model."""

    def _create_user(self, email: str, password: str | None, **extra_fields):
        """
        Create and save a user with the given email and password.
        """
        if not email:
            msg = "The given email must be set"
            raise ValueError(msg)
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.password = make_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):  # type: ignore[override]
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_user_from_google(self, google_data: dict, **extra_fields):
        """
        Create a user from Google OAuth data.
        """
        email = google_data.get('email')
        if not email:
            msg = "Google email must be provided"
            raise ValueError(msg)
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('auth_provider', 'google')
        extra_fields.setdefault('is_google_verified', True)
        
        # Extract user data from Google response
        user_data = {
            'email': email,
            'google_id': google_data.get('sub'),
            'google_email': email,
            'first_name': google_data.get('given_name', ''),
            'last_name': google_data.get('family_name', ''),
            'profile_picture_url': google_data.get('picture'),
            **extra_fields
        }
        
        user = self.model(**user_data)
        user.set_unusable_password()  # Google users don't have a password
        user.save(using=self._db)
        return user

    def update_user_google_info(self, user, google_data: dict):
        """
        Update an existing user with Google OAuth data.
        """
        user.google_id = google_data.get('sub')
        user.google_email = google_data.get('email')
        user.profile_picture_url = google_data.get('picture')
        user.is_google_verified = True
        
        # Update name fields if they're empty
        if not user.first_name and google_data.get('given_name'):
            user.first_name = google_data.get('given_name')
        if not user.last_name and google_data.get('family_name'):
            user.last_name = google_data.get('family_name')
        
        # Update auth provider if not already set
        if user.auth_provider == 'email':
            user.auth_provider = 'google'
        
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):  # type: ignore[override]
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        if extra_fields.get("is_staff") is not True:
            msg = "Superuser must have is_staff=True."
            raise ValueError(msg)
        if extra_fields.get("is_superuser") is not True:
            msg = "Superuser must have is_superuser=True."
            raise ValueError(msg)

        return self._create_user(email, password, **extra_fields)