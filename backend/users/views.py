# accounts/views.py
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
from .serializers import UserSerializer, UsernameUpdateSerializer, UsernameCheckSerializer


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

class FacebookLogin(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client

class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = AppleOAuth2Client


class UsernameUpdateView(APIView):
    """Update username (one-time only)"""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = UsernameUpdateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            user = serializer.update(request.user, serializer.validated_data)
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UsernameCheckView(APIView):
    """Check if username is available"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UsernameCheckSerializer(data=request.data)

        if serializer.is_valid():
            return Response(
                {'available': True, 'username': serializer.validated_data['username']},
                status=status.HTTP_200_OK
            )

        return Response(
            {'available': False, 'errors': serializer.errors},
            status=status.HTTP_200_OK
        )
