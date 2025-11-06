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
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenVerifyView, TokenRefreshView
from rest_framework_simplejwt.tokens import AccessToken
from django.utils import timezone
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UsernameUpdateSerializer, UsernameCheckSerializer

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