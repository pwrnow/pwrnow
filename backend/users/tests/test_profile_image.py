import io
import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User, ProfileImageChangeRequest
from users.serializers import UserSerializer, ProfileImageUploadSerializer, ProfileImageRejectSerializer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def regular_user(db):
    """Create a regular (non-staff) user."""
    return User.objects.create_user(
        email='user@test.com',
        username='testuser',
        password='testpass123'
    )


@pytest.fixture
def staff_user(db):
    """Create a staff user."""
    return User.objects.create_user(
        email='staff@test.com',
        username='staffuser',
        password='testpass123',
        is_staff=True
    )


@pytest.fixture
def authenticated_client(api_client, regular_user):
    """Return an authenticated API client."""
    refresh = RefreshToken.for_user(regular_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    """Return an authenticated API client for staff user."""
    refresh = RefreshToken.for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def sample_image():
    """Create a simple test image file."""
    image = io.BytesIO(b'fake image content')
    image.name = 'test.jpg'
    return SimpleUploadedFile('test.jpg', image.read(), content_type='image/jpeg')


@pytest.fixture
def large_image():
    """Create a large test image file (>5MB)."""
    # Create a 6MB file
    large_content = b'x' * (6 * 1024 * 1024)
    return SimpleUploadedFile('large.jpg', large_content, content_type='image/jpeg')


@pytest.fixture
def invalid_image():
    """Create an invalid image file (not an image)."""
    return SimpleUploadedFile('test.txt', b'not an image', content_type='text/plain')


@pytest.fixture
def png_image():
    """Create a PNG test image file."""
    image = io.BytesIO(b'fake png image content')
    image.name = 'test.png'
    return SimpleUploadedFile('test.png', image.read(), content_type='image/png')


@pytest.fixture
def gif_image():
    """Create a GIF test image file."""
    image = io.BytesIO(b'fake gif image content')
    image.name = 'test.gif'
    return SimpleUploadedFile('test.gif', image.read(), content_type='image/gif')


@pytest.fixture
def webp_image():
    """Create a WebP test image file."""
    image = io.BytesIO(b'fake webp image content')
    image.name = 'test.webp'
    return SimpleUploadedFile('test.webp', image.read(), content_type='image/webp')


# ============================================================================
# Profile Image Upload Tests (POST /user/profile-image/)
# ============================================================================

@pytest.mark.django_db
def test_upload_profile_image_requires_authentication(api_client, sample_image):
    """Test that unauthenticated users cannot upload profile images."""
    url = reverse('profile_image')
    response = api_client.post(url, {'image': sample_image}, format='multipart')
    assert response.status_code == 401


@pytest.mark.django_db
def test_upload_profile_image_success(authenticated_client, regular_user, sample_image):
    """Test successful profile image upload creates pending request."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': sample_image}, format='multipart')

    assert response.status_code == 201
    data = response.json()
    assert 'profile_image_url' in data
    assert 'pending_profile_image_url' in data

    # Check that a pending request was created
    request = ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).first()
    assert request is not None
    assert request.image.name.startswith('profile_image_requests/')


@pytest.mark.django_db
def test_upload_profile_image_cancels_existing_pending(authenticated_client, regular_user, sample_image):
    """Test that uploading a new image cancels existing pending requests."""
    # Create an existing pending request
    old_request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image')
    new_image = SimpleUploadedFile('new.jpg', b'new image', content_type='image/jpeg')
    response = authenticated_client.post(url, {'image': new_image}, format='multipart')

    assert response.status_code == 201

    # Old request should be deleted
    assert not ProfileImageChangeRequest.objects.filter(id=old_request.id).exists()

    # New request should exist
    new_request = ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).first()
    assert new_request is not None
    assert new_request.id != old_request.id


@pytest.mark.django_db
def test_upload_profile_image_validates_file_size(authenticated_client, large_image):
    """Test that images larger than 5MB are rejected."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': large_image}, format='multipart')

    assert response.status_code == 400
    assert 'size' in response.json().get('image', [])[0].lower() or 'size' in str(response.json())


@pytest.mark.django_db
def test_upload_profile_image_validates_file_type(authenticated_client, invalid_image):
    """Test that non-image files are rejected."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': invalid_image}, format='multipart')

    assert response.status_code == 400
    assert 'type' in response.json().get('image', [])[0].lower() or 'type' in str(response.json())


@pytest.mark.django_db
def test_upload_profile_image_missing_file(authenticated_client):
    """Test that missing image file returns 400."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {}, format='multipart')

    assert response.status_code == 400


@pytest.mark.django_db
def test_upload_profile_image_returns_pending_url_for_self(authenticated_client, regular_user, sample_image):
    """Test that user sees their pending image URL."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': sample_image}, format='multipart')

    assert response.status_code == 201
    data = response.json()
    assert data['pending_profile_image_url'] is not None
    assert 'profile_image_requests' in data['pending_profile_image_url']


# ============================================================================
# Profile Image Delete Tests (DELETE /user/profile-image/)
# ============================================================================

@pytest.mark.django_db
def test_delete_profile_image_requires_authentication(api_client):
    """Test that unauthenticated users cannot delete profile images."""
    url = reverse('profile_image')
    response = api_client.delete(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_delete_profile_image_success(authenticated_client, regular_user, sample_image):
    """Test successful deletion of approved profile image."""
    # Set an approved profile image
    regular_user.profile_image = sample_image
    regular_user.save()

    url = reverse('profile_image')
    response = authenticated_client.delete(url)

    assert response.status_code == 200
    regular_user.refresh_from_db()
    assert regular_user.profile_image.name == '' or not regular_user.profile_image


@pytest.mark.django_db
def test_delete_profile_image_when_none_exists(authenticated_client):
    """Test deleting when no profile image exists returns 400."""
    url = reverse('profile_image')
    response = authenticated_client.delete(url)

    assert response.status_code == 400
    assert 'error' in response.json()


@pytest.mark.django_db
def test_delete_profile_image_does_not_affect_pending_requests(authenticated_client, regular_user, sample_image):
    """Test that deleting approved image doesn't affect pending requests."""
    # Set approved image
    regular_user.profile_image = sample_image
    regular_user.save()

    # Create a pending request
    pending_request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image')
    response = authenticated_client.delete(url)

    assert response.status_code == 200
    # Pending request should still exist
    assert ProfileImageChangeRequest.objects.filter(id=pending_request.id).exists()


# ============================================================================
# Admin List Requests Tests (GET /profile-image-requests/)
# ============================================================================

@pytest.mark.django_db
def test_list_profile_image_requests_requires_staff(api_client):
    """Test that non-staff users cannot list requests."""
    url = reverse('profile_image_requests_list')
    response = api_client.get(url)
    assert response.status_code == 401


@pytest.mark.django_db
def test_list_profile_image_requests_requires_authentication(authenticated_client):
    """Test that regular authenticated users cannot list requests."""
    url = reverse('profile_image_requests_list')
    response = authenticated_client.get(url)
    assert response.status_code == 403


@pytest.mark.django_db
def test_list_profile_image_requests_success(staff_client, regular_user, sample_image):
    """Test that staff can list pending requests."""
    # Create pending requests
    request1 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Create another user with pending request
    user2 = User.objects.create_user(
        email='user2@test.com',
        username='user2',
        password='testpass123'
    )
    request2 = ProfileImageChangeRequest.objects.create(
        user=user2,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Create an approved request (should not appear)
    request3 = ProfileImageChangeRequest.objects.create(
        user=user2,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.APPROVED
    )

    url = reverse('profile_image_requests_list')
    response = staff_client.get(url)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    # Check that only pending requests are returned
    request_ids = [item['id'] for item in data]
    assert str(request1.id) in request_ids
    assert str(request2.id) in request_ids
    assert str(request3.id) not in request_ids


@pytest.mark.django_db
def test_list_profile_image_requests_empty(staff_client):
    """Test listing when no pending requests exist."""
    url = reverse('profile_image_requests_list')
    response = staff_client.get(url)

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db
def test_list_profile_image_requests_includes_user_info(staff_client, regular_user, sample_image):
    """Test that list includes user information."""
    ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_requests_list')
    response = staff_client.get(url)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['user_id'] == str(regular_user.id)
    assert data[0]['username'] == regular_user.username
    assert data[0]['user_email'] == regular_user.email
    assert 'image_url' in data[0]


# ============================================================================
# Admin Approve Request Tests (POST /profile-image-requests/{id}/approve/)
# ============================================================================

@pytest.mark.django_db
def test_approve_profile_image_request_requires_staff(authenticated_client, regular_user, sample_image):
    """Test that non-staff users cannot approve requests."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = authenticated_client.post(url)

    assert response.status_code == 403


@pytest.mark.django_db
def test_approve_profile_image_request_success(staff_client, regular_user, sample_image):
    """Test successful approval of profile image request."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 200

    # Check request status updated
    request.refresh_from_db()
    assert request.status == ProfileImageChangeRequest.Status.APPROVED
    assert request.reviewed_at is not None
    assert request.reviewed_by is not None

    # Check user's profile image was set
    regular_user.refresh_from_db()
    assert regular_user.profile_image.name != ''


@pytest.mark.django_db
def test_approve_profile_image_request_not_found(staff_client):
    """Test approving non-existent request returns 404."""
    from uuid import uuid4
    fake_id = uuid4()
    url = reverse('profile_image_request_approve', kwargs={'request_id': fake_id})
    response = staff_client.post(url)

    assert response.status_code == 404


@pytest.mark.django_db
def test_approve_profile_image_request_already_processed(staff_client, regular_user, sample_image):
    """Test approving already processed request returns 404."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.APPROVED,
        reviewed_at=timezone.now()
    )

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 404


@pytest.mark.django_db
def test_approve_profile_image_request_tracks_reviewer(staff_client, staff_user, regular_user, sample_image):
    """Test that approval tracks who reviewed the request."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 200
    request.refresh_from_db()
    assert request.reviewed_by == staff_user


# ============================================================================
# Admin Reject Request Tests (POST /profile-image-requests/{id}/reject/)
# ============================================================================

@pytest.mark.django_db
def test_reject_profile_image_request_requires_staff(authenticated_client, regular_user, sample_image):
    """Test that non-staff users cannot reject requests."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = authenticated_client.post(url, {'feedback': 'Test feedback'}, format='json')

    assert response.status_code == 403


@pytest.mark.django_db
def test_reject_profile_image_request_success(staff_client, regular_user, sample_image):
    """Test successful rejection of profile image request."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    feedback = 'Image does not meet guidelines'
    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': feedback}, format='json')

    assert response.status_code == 200

    # Check request status updated
    request.refresh_from_db()
    assert request.status == ProfileImageChangeRequest.Status.REJECTED
    assert request.rejection_feedback == feedback
    assert request.reviewed_at is not None
    assert request.reviewed_by is not None


@pytest.mark.django_db
def test_reject_profile_image_request_requires_feedback(staff_client, regular_user, sample_image):
    """Test that rejection requires feedback."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {}, format='json')

    assert response.status_code == 400
    assert 'feedback' in response.json()


@pytest.mark.django_db
def test_reject_profile_image_request_empty_feedback(staff_client, regular_user, sample_image):
    """Test that empty feedback is rejected."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': ''}, format='json')

    assert response.status_code == 400


@pytest.mark.django_db
def test_reject_profile_image_request_not_found(staff_client):
    """Test rejecting non-existent request returns 404."""
    from uuid import uuid4
    fake_id = uuid4()
    url = reverse('profile_image_request_reject', kwargs={'request_id': fake_id})
    response = staff_client.post(url, {'feedback': 'Test'}, format='json')

    assert response.status_code == 404


@pytest.mark.django_db
def test_reject_profile_image_request_already_processed(staff_client, regular_user, sample_image):
    """Test rejecting already processed request returns 404."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.REJECTED,
        reviewed_at=timezone.now()
    )

    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': 'Test'}, format='json')

    assert response.status_code == 404


@pytest.mark.django_db
def test_reject_profile_image_request_tracks_reviewer(staff_client, staff_user, regular_user, sample_image):
    """Test that rejection tracks who reviewed the request."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': 'Test feedback'}, format='json')

    assert response.status_code == 200
    request.refresh_from_db()
    assert request.reviewed_by == staff_user


# ============================================================================
# Model Tests
# ============================================================================

@pytest.mark.django_db
def test_profile_image_change_request_str(regular_user, sample_image):
    """Test ProfileImageChangeRequest string representation."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    assert str(request) == f"ProfileImageChangeRequest({regular_user.username}, pending)"


@pytest.mark.django_db
def test_user_pending_profile_image_request_property(regular_user, sample_image):
    """Test User.pending_profile_image_request property."""
    # No pending request
    assert regular_user.pending_profile_image_request is None

    # Create pending request
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    assert regular_user.pending_profile_image_request == request

    # Create another pending request (should return latest)
    request2 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    assert regular_user.pending_profile_image_request == request2

    # Approve request - should return None
    request2.status = ProfileImageChangeRequest.Status.APPROVED
    request2.save()

    assert regular_user.pending_profile_image_request is None


@pytest.mark.django_db
def test_profile_image_change_request_ordering(regular_user, sample_image):
    """Test that requests are ordered by created_at descending."""
    request1 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    request2 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    requests = list(ProfileImageChangeRequest.objects.filter(
        user=regular_user
    ).order_by('-created_at'))

    assert requests[0] == request2
    assert requests[1] == request1


# ============================================================================
# Serializer Tests
# ============================================================================

@pytest.mark.django_db
def test_user_serializer_includes_profile_image_url(regular_user, sample_image, api_client):
    """Test that UserSerializer includes profile_image_url."""
    regular_user.profile_image = sample_image
    regular_user.save()

    request = api_client.request()
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert 'profile_image_url' in data
    assert data['profile_image_url'] is not None


@pytest.mark.django_db
def test_user_serializer_includes_pending_url_for_self(regular_user, sample_image, api_client):
    """Test that UserSerializer includes pending_profile_image_url for self."""
    ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    request = api_client.request()
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert 'pending_profile_image_url' in data
    assert data['pending_profile_image_url'] is not None


@pytest.fixture
def other_user(db):
    """Create another user for testing."""
    return User.objects.create_user(
        email='other@test.com',
        username='otheruser',
        password='testpass123'
    )


@pytest.mark.django_db
def test_user_serializer_excludes_pending_url_for_others(regular_user, other_user, sample_image, api_client):
    """Test that UserSerializer excludes pending_profile_image_url for other users."""
    ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    request = api_client.request()
    request.user = other_user  # Simulate viewing another user
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert data.get('pending_profile_image_url') is None


# ============================================================================
# Edge Cases and Integration Tests
# ============================================================================

@pytest.mark.django_db
def test_approve_replaces_existing_profile_image(staff_client, regular_user, sample_image):
    """Test that approving a new request replaces existing profile image."""
    # Set existing profile image
    old_image = SimpleUploadedFile('old.jpg', b'old image', content_type='image/jpeg')
    regular_user.profile_image = old_image
    regular_user.save()
    old_image_path = regular_user.profile_image.name

    # Create and approve new request
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 200
    regular_user.refresh_from_db()
    assert regular_user.profile_image.name != old_image_path


@pytest.mark.django_db
def test_multiple_pending_requests_cancelled_on_upload(authenticated_client, regular_user, sample_image):
    """Test that multiple pending requests are cancelled when uploading new image."""
    # Create multiple pending requests
    request1 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )
    request2 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Upload new image
    url = reverse('profile_image')
    new_image = SimpleUploadedFile('new.jpg', b'new image', content_type='image/jpeg')
    response = authenticated_client.post(url, {'image': new_image}, format='multipart')

    assert response.status_code == 201

    # Both old requests should be deleted
    assert not ProfileImageChangeRequest.objects.filter(id=request1.id).exists()
    assert not ProfileImageChangeRequest.objects.filter(id=request2.id).exists()

    # New request should exist
    assert ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).count() == 1


@pytest.mark.django_db
def test_approved_request_not_cancelled_on_upload(authenticated_client, regular_user, sample_image):
    """Test that approved requests are not cancelled when uploading new image."""
    # Create approved request
    approved_request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.APPROVED
    )

    # Upload new image
    url = reverse('profile_image')
    new_image = SimpleUploadedFile('new.jpg', b'new image', content_type='image/jpeg')
    response = authenticated_client.post(url, {'image': new_image}, format='multipart')

    assert response.status_code == 201

    # Approved request should still exist
    assert ProfileImageChangeRequest.objects.filter(id=approved_request.id).exists()


@pytest.mark.django_db
def test_rejected_request_not_cancelled_on_upload(authenticated_client, regular_user, sample_image):
    """Test that rejected requests are not cancelled when uploading new image."""
    # Create rejected request
    rejected_request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.REJECTED
    )

    # Upload new image
    url = reverse('profile_image')
    new_image = SimpleUploadedFile('new.jpg', b'new image', content_type='image/jpeg')
    response = authenticated_client.post(url, {'image': new_image}, format='multipart')

    assert response.status_code == 201

    # Rejected request should still exist
    assert ProfileImageChangeRequest.objects.filter(id=rejected_request.id).exists()


# ============================================================================
# Image Format Tests
# ============================================================================

@pytest.mark.django_db
def test_upload_profile_image_png_success(authenticated_client, regular_user, png_image):
    """Test that PNG images can be uploaded."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': png_image}, format='multipart')

    assert response.status_code == 201
    request = ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).first()
    assert request is not None


@pytest.mark.django_db
def test_upload_profile_image_gif_success(authenticated_client, regular_user, gif_image):
    """Test that GIF images can be uploaded."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': gif_image}, format='multipart')

    assert response.status_code == 201
    request = ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).first()
    assert request is not None


@pytest.mark.django_db
def test_upload_profile_image_webp_success(authenticated_client, regular_user, webp_image):
    """Test that WebP images can be uploaded."""
    url = reverse('profile_image')
    response = authenticated_client.post(url, {'image': webp_image}, format='multipart')

    assert response.status_code == 201
    request = ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).first()
    assert request is not None


# ============================================================================
# Notification Tests
# ============================================================================

@pytest.mark.django_db
@patch('notifications.services.send_push_notification_to_user')
def test_reject_profile_image_request_sends_notification(mock_send_notification, staff_client, regular_user, sample_image):
    """Test that rejecting a request sends a push notification."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    feedback = 'Image does not meet guidelines'
    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': feedback}, format='json')

    assert response.status_code == 200
    mock_send_notification.assert_called_once()
    call_args = mock_send_notification.call_args
    assert call_args[1]['user'] == regular_user
    assert 'Profile Image Rejected' in call_args[1]['title']
    assert call_args[1]['body'] == feedback


@pytest.mark.django_db
@patch('notifications.services.send_push_notification_to_user')
def test_reject_profile_image_request_notification_failure_does_not_fail_request(mock_send_notification, staff_client, regular_user, sample_image):
    """Test that notification failure doesn't cause request rejection to fail."""
    mock_send_notification.side_effect = Exception('Notification service unavailable')

    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    feedback = 'Image does not meet guidelines'
    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': feedback}, format='json')

    # Request should still be rejected even if notification fails
    assert response.status_code == 200
    request.refresh_from_db()
    assert request.status == ProfileImageChangeRequest.Status.REJECTED
    assert request.rejection_feedback == feedback


# ============================================================================
# Feedback Validation Tests
# ============================================================================

@pytest.mark.django_db
def test_reject_profile_image_request_feedback_max_length(staff_client, regular_user, sample_image):
    """Test that feedback cannot exceed 500 characters."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Create feedback that's too long (501 characters)
    long_feedback = 'x' * 501
    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': long_feedback}, format='json')

    assert response.status_code == 400
    assert 'feedback' in response.json()


@pytest.mark.django_db
def test_reject_profile_image_request_feedback_exactly_max_length(staff_client, regular_user, sample_image):
    """Test that feedback of exactly 500 characters is accepted."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Create feedback of exactly 500 characters
    max_feedback = 'x' * 500
    url = reverse('profile_image_request_reject', kwargs={'request_id': request.id})
    response = staff_client.post(url, {'feedback': max_feedback}, format='json')

    assert response.status_code == 200
    request.refresh_from_db()
    assert request.rejection_feedback == max_feedback


# ============================================================================
# Serializer Validation Tests
# ============================================================================

@pytest.mark.django_db
def test_profile_image_upload_serializer_validates_size():
    """Test ProfileImageUploadSerializer validates file size."""
    large_content = b'x' * (6 * 1024 * 1024)  # 6MB
    large_file = SimpleUploadedFile('large.jpg', large_content, content_type='image/jpeg')

    serializer = ProfileImageUploadSerializer(data={'image': large_file})
    assert not serializer.is_valid()
    assert 'image' in serializer.errors


@pytest.mark.django_db
def test_profile_image_upload_serializer_validates_type():
    """Test ProfileImageUploadSerializer validates file type."""
    invalid_file = SimpleUploadedFile('test.txt', b'not an image', content_type='text/plain')

    serializer = ProfileImageUploadSerializer(data={'image': invalid_file})
    assert not serializer.is_valid()
    assert 'image' in serializer.errors


@pytest.mark.django_db
def test_profile_image_reject_serializer_validates_feedback_length():
    """Test ProfileImageRejectSerializer validates feedback length."""
    # Empty feedback
    serializer = ProfileImageRejectSerializer(data={'feedback': ''})
    assert not serializer.is_valid()
    assert 'feedback' in serializer.errors

    # Too long feedback
    long_feedback = 'x' * 501
    serializer = ProfileImageRejectSerializer(data={'feedback': long_feedback})
    assert not serializer.is_valid()
    assert 'feedback' in serializer.errors

    # Valid feedback
    valid_feedback = 'This is valid feedback'
    serializer = ProfileImageRejectSerializer(data={'feedback': valid_feedback})
    assert serializer.is_valid()


# ============================================================================
# Image Copy Tests (Approval)
# ============================================================================

@pytest.mark.django_db
def test_approve_profile_image_request_copies_image_content(staff_client, regular_user, sample_image):
    """Test that approval correctly copies image content to user profile."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Store original image path
    original_image_path = request.image.name

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 200
    regular_user.refresh_from_db()

    # User should have profile image set
    assert regular_user.profile_image.name != ''
    # Profile image should be in profile_images directory, not profile_image_requests
    assert 'profile_images' in regular_user.profile_image.name
    assert 'profile_image_requests' not in regular_user.profile_image.name


@pytest.mark.django_db
def test_approve_profile_image_request_preserves_request_image(staff_client, regular_user, sample_image):
    """Test that approval doesn't delete the original request image."""
    request = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    original_image_path = request.image.name

    url = reverse('profile_image_request_approve', kwargs={'request_id': request.id})
    response = staff_client.post(url)

    assert response.status_code == 200

    # Request image should still exist
    request.refresh_from_db()
    assert request.image.name == original_image_path


# ============================================================================
# User Serializer Tests (Extended)
# ============================================================================

@pytest.mark.django_db
def test_user_serializer_profile_image_url_none_when_no_image(regular_user, api_client):
    """Test that profile_image_url is None when user has no image."""
    request = api_client.request()
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert 'profile_image_url' in data
    assert data['profile_image_url'] is None


@pytest.mark.django_db
def test_user_serializer_pending_url_none_when_no_pending(regular_user, api_client):
    """Test that pending_profile_image_url is None when no pending request."""
    request = api_client.request()
    request.user = regular_user
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert 'pending_profile_image_url' in data
    assert data['pending_profile_image_url'] is None


@pytest.mark.django_db
def test_user_serializer_shows_approved_over_pending(regular_user, sample_image, api_client):
    """Test that approved image URL is shown even if pending exists."""
    # Set approved image
    regular_user.profile_image = sample_image
    regular_user.save()

    # Create pending request
    ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    request = api_client.request()
    request.user = regular_user
    serializer = UserSerializer(regular_user, context={'request': request})
    data = serializer.data

    assert data['profile_image_url'] is not None
    assert 'profile_images' in data['profile_image_url']
    assert data['pending_profile_image_url'] is not None
    assert 'profile_image_requests' in data['pending_profile_image_url']


# ============================================================================
# Edge Cases
# ============================================================================

@pytest.mark.django_db
def test_upload_profile_image_with_existing_approved_image(authenticated_client, regular_user, sample_image):
    """Test uploading new image when user already has approved image."""
    # Set existing approved image
    regular_user.profile_image = sample_image
    regular_user.save()

    # Upload new image
    url = reverse('profile_image')
    new_image = SimpleUploadedFile('new.jpg', b'new image', content_type='image/jpeg')
    response = authenticated_client.post(url, {'image': new_image}, format='multipart')

    assert response.status_code == 201

    # Approved image should still exist
    regular_user.refresh_from_db()
    assert regular_user.profile_image.name != ''

    # New pending request should exist
    assert ProfileImageChangeRequest.objects.filter(
        user=regular_user,
        status=ProfileImageChangeRequest.Status.PENDING
    ).exists()


@pytest.mark.django_db
def test_delete_profile_image_returns_updated_user_data(authenticated_client, regular_user, sample_image):
    """Test that delete endpoint returns updated user data."""
    regular_user.profile_image = sample_image
    regular_user.save()

    url = reverse('profile_image')
    response = authenticated_client.delete(url)

    assert response.status_code == 200
    data = response.json()
    assert 'profile_image_url' in data
    assert data['profile_image_url'] is None


@pytest.mark.django_db
def test_list_profile_image_requests_ordered_by_created_at(staff_client, regular_user, sample_image):
    """Test that requests are ordered by created_at descending."""
    # Create requests with slight time difference
    request1 = ProfileImageChangeRequest.objects.create(
        user=regular_user,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    # Create another user
    user2 = User.objects.create_user(
        email='user2@test.com',
        username='user2',
        password='testpass123'
    )
    request2 = ProfileImageChangeRequest.objects.create(
        user=user2,
        image=sample_image,
        status=ProfileImageChangeRequest.Status.PENDING
    )

    url = reverse('profile_image_requests_list')
    response = staff_client.get(url)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Most recent should be first
    assert data[0]['id'] == str(request2.id)
    assert data[1]['id'] == str(request1.id)

