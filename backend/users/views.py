# accounts/views.py
from django.conf import settings
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
# Apple often uses a special client, but the adapter can handle it in many setups
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as AllAuthOAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

import requests
from urllib.parse import parse_qsl

from django.utils.http import urlencode

from allauth.socialaccount.adapter import get_adapter


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


class GoogleLogin(SocialLoginView): # if you want to use Authorization Code Grant, use this
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:8000/v1/auth/google/'
    client_class = OAuth2Client

class FacebookLogin(SocialLoginView):
    adapter_class = FacebookOAuth2Adapter
    client_class = OAuth2Client

class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = OAuth2Client  # or Apple-specific client if required
    # callback_url = settings.APPLE_CALLBACK_URL
