# accounts/views.py
import logging
from utils.logging_mixins import ApiLoggingMixin
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
# Apple often uses a special client, but the adapter can handle it in many setups
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as AllAuthOAuth2Client
from allauth.socialaccount.providers.apple.client import AppleOAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenVerifyView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from .models import ProfileImageChangeRequest
from .serializers import (
    UserSerializer, UsernameUpdateSerializer, UsernameCheckSerializer,
    ProfileImageChangeRequestSerializer, ProfileImageUploadSerializer,
    ProfileImageRejectSerializer
)

User = get_user_model()


class OAuth2Error(Exception):
    pass


class OAuth2Client(AllAuthOAuth2Client):
    def __init__(
        self,
        request,
        consumer_key,
        consumer_secret,
        access_token_method,
        access_token_url,
        callback_url,
        _scope,
        scope_delimiter=" ",
        headers=None,
        basic_auth=False,
    ):
        super().__init__(request, consumer_key, consumer_secret, access_token_method, access_token_url, callback_url, scope_delimiter, headers, basic_auth)


class GoogleLogin(SocialLoginView): # if you want to use Access Token, use this
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.debug("Google login initiated")
        response = super().post(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            user_id = getattr(getattr(request, 'user', None), 'id', None)
            logger.info(f"Google login successful: user_id={user_id}")
        else:
            logger.warning(f"Google login failed: status={response.status_code}")
        return response

class FacebookLogin(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client

    def post(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.debug("Facebook login initiated")
        response = super().post(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            user_id = getattr(getattr(request, 'user', None), 'id', None)
            logger.info(f"Facebook login successful: user_id={user_id}")
        else:
            logger.warning(f"Facebook login failed: status={response.status_code}")
        return response

class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = AppleOAuth2Client

    def post(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.debug("Apple login initiated")
        response = super().post(request, *args, **kwargs)
        if response.status_code in [200, 201]:
            user_id = getattr(getattr(request, 'user', None), 'id', None)
            logger.info(f"Apple login successful: user_id={user_id}")
        else:
            logger.warning(f"Apple login failed: status={response.status_code}")
        return response


class UsernameUpdateView(ApiLoggingMixin, APIView):
    """Update username (one-time only)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        logger = logging.getLogger(__name__)
        logger.debug(f"Username update attempt: user_id={request.user.id}")
        serializer = UsernameUpdateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            old_username = request.user.username
            user = serializer.update(request.user, serializer.validated_data)
            logger.info(f"Username updated successfully: user_id={user.id} old_username={old_username} new_username={user.username}")
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_200_OK)

        logger.warning(f"Username update validation failed: user_id={request.user.id} errors={serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsernameCheckView(ApiLoggingMixin, APIView):
    """Check if username is available"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger = logging.getLogger(__name__)
        username = request.data.get('username', '')
        logger.debug(f"Username availability check: user_id={request.user.id} username={username}")
        serializer = UsernameCheckSerializer(data=request.data)

        if serializer.is_valid():
            logger.debug(f"Username available: username={serializer.validated_data['username']}")
            return Response(
                {'available': True, 'username': serializer.validated_data['username']},
                status=status.HTTP_200_OK
            )

        logger.debug(f"Username not available: username={username}")
        return Response(
            {'available': False, 'errors': serializer.errors},
            status=status.HTTP_200_OK
        )


class CustomTokenVerifyView(TokenVerifyView):
    """
    Custom token verification view that updates user's last_login timestamp
    when token is successfully verified.
    """

    def post(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.debug("Token verification initiated")
        # Call the parent method to verify the token
        response = super().post(request, *args, **kwargs)

        # If token verification was successful (200 status), update last_login
        if response.status_code == 200 and request.user.is_authenticated:
            try:
                request.user.last_login = timezone.now()
                request.user.save(update_fields=['last_login'])
                logger.info(f"Token verified successfully: user_id={request.user.id}")
            except Exception as e:
                # Log the error but don't fail the token verification
                logger.warning(f"Failed to update last_login during token verification: user_id={request.user.id} error={e}")
        elif response.status_code != 200:
            logger.warning(f"Token verification failed: status={response.status_code}")

        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that updates user's last_login timestamp
    when token is successfully refreshed.
    """

    def post(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        logger.debug("Token refresh initiated")
        # Call the parent method to refresh the token
        response = super().post(request, *args, **kwargs)

        # If token refresh was successful (200 status), update last_login
        if response.status_code == 200 and request.user.is_authenticated:
            try:
                request.user.last_login = timezone.now()
                request.user.save(update_fields=['last_login'])
                logger.info(f"Token refreshed successfully: user_id={request.user.id}")
            except Exception as e:
                # Log the error but don't fail the token refresh
                logger.warning(f"Failed to update last_login during token refresh: user_id={request.user.id} error={e}")
        elif response.status_code != 200:
            logger.warning(f"Token refresh failed: status={response.status_code}")

        return response


class ProfileImageView(ApiLoggingMixin, APIView):
    """Handle profile image upload (POST) and delete (DELETE)."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        """Upload a new profile image (creates pending change request)."""
        logger = logging.getLogger(__name__)
        logger.debug(f"Profile image upload attempt: user_id={request.user.id}")

        serializer = ProfileImageUploadSerializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(f"Profile image upload validation failed: user_id={request.user.id} errors={serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Cancel any existing pending requests for this user
        existing_pending = ProfileImageChangeRequest.objects.filter(
            user=request.user,
            status=ProfileImageChangeRequest.Status.PENDING
        )
        if existing_pending.exists():
            logger.info(f"Cancelling {existing_pending.count()} existing pending requests for user_id={request.user.id}")
            existing_pending.delete()

        # Create new change request
        change_request = ProfileImageChangeRequest.objects.create(
            user=request.user,
            image=serializer.validated_data['image']
        )

        logger.info(f"Profile image change request created: request_id={change_request.id} user_id={request.user.id}")

        # Return updated user data with pending image
        user_serializer = UserSerializer(request.user, context={'request': request})
        return Response(user_serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Delete the user's approved profile image."""
        logger = logging.getLogger(__name__)
        user = request.user

        if not user.profile_image:
            return Response(
                {'error': _('No profile image to delete')},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Deleting profile image for user_id={user.id}")
        user.profile_image.delete(save=True)

        user_serializer = UserSerializer(user, context={'request': request})
        return Response(user_serializer.data, status=status.HTTP_200_OK)


class ProfileImageRequestListView(ApiLoggingMixin, generics.ListAPIView):
    """List pending profile image change requests (staff only)."""
    permission_classes = [IsAdminUser]
    serializer_class = ProfileImageChangeRequestSerializer

    def get_queryset(self):
        return ProfileImageChangeRequest.objects.filter(
            status=ProfileImageChangeRequest.Status.PENDING
        ).select_related('user').order_by('-created_at')


class ProfileImageRequestApproveView(ApiLoggingMixin, APIView):
    """Approve a profile image change request (staff only)."""
    permission_classes = [IsAdminUser]

    def post(self, request, request_id):
        logger = logging.getLogger(__name__)

        try:
            change_request = ProfileImageChangeRequest.objects.select_related('user').get(
                id=request_id,
                status=ProfileImageChangeRequest.Status.PENDING
            )
        except ProfileImageChangeRequest.DoesNotExist:
            return Response(
                {'error': _('Request not found or already processed')},
                status=status.HTTP_404_NOT_FOUND
            )

        # Copy image to user's profile_image
        user = change_request.user
        if change_request.image:
            # Read the image content and save to user's profile_image
            image_name = change_request.image.name.split('/')[-1]
            user.profile_image.save(
                image_name,
                ContentFile(change_request.image.read()),
                save=True
            )

        # Update request status
        change_request.status = ProfileImageChangeRequest.Status.APPROVED
        change_request.reviewed_at = timezone.now()
        change_request.reviewed_by = request.user
        change_request.save()

        logger.info(f"Profile image approved: request_id={request_id} user_id={user.id} reviewed_by={request.user.id}")

        serializer = ProfileImageChangeRequestSerializer(change_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfileImageRequestRejectView(ApiLoggingMixin, APIView):
    """Reject a profile image change request with feedback (staff only)."""
    permission_classes = [IsAdminUser]

    def post(self, request, request_id):
        logger = logging.getLogger(__name__)

        serializer = ProfileImageRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            change_request = ProfileImageChangeRequest.objects.select_related('user').get(
                id=request_id,
                status=ProfileImageChangeRequest.Status.PENDING
            )
        except ProfileImageChangeRequest.DoesNotExist:
            return Response(
                {'error': _('Request not found or already processed')},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update request status with feedback
        change_request.status = ProfileImageChangeRequest.Status.REJECTED
        change_request.rejection_feedback = serializer.validated_data['feedback']
        change_request.reviewed_at = timezone.now()
        change_request.reviewed_by = request.user
        change_request.save()

        logger.info(f"Profile image rejected: request_id={request_id} user_id={change_request.user.id} reviewed_by={request.user.id}")

        # Send push notification to user with rejection feedback
        try:
            from notifications.services import send_push_notification_to_user
            send_push_notification_to_user(
                user=change_request.user,
                title=_('Profile Image Rejected'),
                body=serializer.validated_data['feedback']
            )
            logger.info(f"Rejection notification sent to user_id={change_request.user.id}")
        except Exception as e:
            logger.warning(f"Failed to send rejection notification: user_id={change_request.user.id} error={e}")

        response_serializer = ProfileImageChangeRequestSerializer(change_request, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)