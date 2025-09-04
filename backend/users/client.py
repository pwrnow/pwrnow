import time
from urllib.parse import parse_qsl, quote, urlencode

from django.core.exceptions import ImproperlyConfigured

import jwt

from allauth.socialaccount.adapter import get_adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client, OAuth2Error
# accounts/views.py
from allauth.socialaccount.providers.facebook.views import FacebookOAuth2Adapter
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
# Apple often uses a special client, but the adapter can handle it in many setups
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as AllAuthOAuth2Client
from allauth.socialaccount.providers.apple.client import AppleOAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings



def jwt_encode(*args, **kwargs):
    resp = jwt.encode(*args, **kwargs)
    if isinstance(resp, bytes):
        # For PyJWT <2
        resp = resp.decode("utf-8")
    return resp


class Scope:
    EMAIL = "email"
    NAME = "name"



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



class AppleOAuth2Client(OAuth2Client):
    """
    Custom client because `Sign In With Apple`:
        * requires `response_mode` field in redirect_url
        * requires special `client_secret` as JWT
    """

    def generate_client_secret(self):
        """Create a JWT signed with an apple provided private key"""
        now = int(time.time())
        app = get_adapter(self.request).get_app(self.request, "apple")
        if not app.key:
            raise ImproperlyConfigured("Apple 'key' missing")
        certificate_key = app.settings.get("certificate_key")
        if not certificate_key:
            raise ImproperlyConfigured("Apple 'certificate_key' missing")
        claims = {
            "iss": app.key,
            "aud": "https://appleid.apple.com",
            "sub": self.get_client_id(),
            "iat": now,
            "exp": now + 60 * 60,
        }
        headers = {"kid": self.consumer_secret, "alg": "ES256"}
        client_secret = jwt_encode(
            payload=claims, key=certificate_key, algorithm="ES256", headers=headers
        )
        print(client_secret)
        return client_secret

    def get_client_id(self):
        """We support multiple client_ids, but use the first one for api calls"""
        return self.consumer_key.split(",")[0]

    def get_access_token(self, code, pkce_code_verifier=None):
        url = self.access_token_url
        client_secret = self.generate_client_secret()
        data = {
            "client_id": self.get_client_id(),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.callback_url,
            "client_secret": client_secret,
        }
        if pkce_code_verifier:
            data["code_verifier"] = pkce_code_verifier
        self._strip_empty_keys(data)
        resp = (
            get_adapter()
            .get_requests_session()
            .request(self.access_token_method, url, data=data, headers=self.headers)
        )
        access_token = None
        if resp.status_code in [200, 201]:
            try:
                access_token = resp.json()
            except ValueError:
                access_token = dict(parse_qsl(resp.text))
        if not access_token or "access_token" not in access_token:
            raise OAuth2Error("Error retrieving access token: %s" % resp.content)
        return access_token

    def get_redirect_url(self, authorization_url, scope, extra_params):
        scope = self.scope_delimiter.join(set(scope))
        params = {
            "client_id": self.get_client_id(),
            "redirect_uri": self.callback_url,
            "response_mode": "form_post",
            "scope": scope,
            "response_type": "code id_token",
        }
        if self.state:
            params["state"] = self.state
        params.update(extra_params)
        return "%s?%s" % (authorization_url, urlencode(params, quote_via=quote))