import json
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient
from notifications.models import Device


@pytest.fixture()
def api_client() -> APIClient:
    return APIClient()


@pytest.mark.django_db()
def test_register_device_creates_new_device(api_client: APIClient):
    url = reverse('register_device')
    payload = {
        'expoPushToken': 'ExponentPushToken[test-token-abc]',
        'platform': 'ios',
        'deviceName': 'iPhone 15',
        'appVersion': '1.2.3',
        'notificationsEnabled': True,
        'preferredLanguage': 'en-US',  # should normalize to 'en'
    }

    response = api_client.post(url, data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 201
    body = response.json()
    assert 'device' in body
    device = Device.objects.get(expo_push_token=payload['expoPushToken'])
    assert device.platform == 'ios'
    assert device.device_name == 'iPhone 15'
    assert device.app_version == '1.2.3'
    assert device.notifications_enabled is True
    assert device.preferred_language == 'en'


@pytest.mark.django_db()
def test_register_device_missing_token_is_400(api_client: APIClient):
    url = reverse('register_device')
    payload = {
        'platform': 'ios',
    }
    response = api_client.post(url, data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    errors = response.json()
    assert 'expoPushToken' in errors


@pytest.mark.django_db()
def test_register_device_invalid_token_format_is_400(api_client: APIClient):
    url = reverse('register_device')
    payload = {
        'expoPushToken': 'invalid-token',
        'platform': 'ios',
    }
    response = api_client.post(url, data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 400
    errors = response.json()
    assert 'expoPushToken' in errors


@pytest.mark.django_db()
def test_register_device_updates_existing_device(api_client: APIClient):
    # Create an existing device
    device = Device.objects.create(
        expo_push_token='ExpoPushToken[existing]',
        platform='android',
        device_name='Old Name',
        app_version='0.9.0',
        notifications_enabled=False,
        preferred_language='pl',
    )
    previous_last_active = device.last_active_at

    url = reverse('register_device')
    payload = {
        'expoPushToken': 'ExpoPushToken[existing]',
        'platform': 'ios',  # update platform
        'deviceName': 'New Name',
        'appVersion': '1.0.0',
        'notificationsEnabled': True,
        'preferredLanguage': 'de-DE',  # unsupported -> fallback to settings.LANGUAGE_CODE (pl)
    }

    response = api_client.post(url, data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 200
    device.refresh_from_db()
    assert device.platform == 'ios'
    assert device.device_name == 'New Name'
    assert device.app_version == '1.0.0'
    assert device.notifications_enabled is True
    assert device.preferred_language in ('pl',)  # fallback
    assert device.last_active_at >= previous_last_active


@pytest.mark.django_db()
def test_register_device_defaults_and_language_normalization(api_client: APIClient):
    url = reverse('register_device')
    payload = {
        'expoPushToken': 'ExpoPushToken[minimal]',
        'platform': 'android',
        'preferredLanguage': 'EN',  # case-insensitive -> 'en'
    }
    response = api_client.post(url, data=json.dumps(payload), content_type='application/json')
    assert response.status_code == 201
    device = Device.objects.get(expo_push_token='ExpoPushToken[minimal]')
    assert device.platform == 'android'
    assert device.notifications_enabled is True
    assert device.preferred_language == 'en'

