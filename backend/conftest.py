import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_factory(db):
    from users.models import User

    def create_user(**kwargs):
        defaults = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "testpass123",
        }
        defaults.update(kwargs)
        password = defaults.pop("password")
        user = User.objects.create(**defaults)
        user.set_password(password)
        user.save()
        return user

    return create_user


@pytest.fixture
def regular_user(user_factory):
    return user_factory()


@pytest.fixture
def staff_user(user_factory):
    return user_factory(
        email="staff@example.com",
        username="staffuser",
        is_staff=True,
    )


@pytest.fixture
def authenticated_client(api_client, regular_user):
    refresh = RefreshToken.for_user(regular_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    refresh = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return api_client
