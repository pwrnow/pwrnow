from django.urls import path, include
from .views import GoogleLogin, FacebookLogin, AppleLogin
from rest_framework_simplejwt.views import TokenVerifyView
from dj_rest_auth.jwt_auth import get_refresh_view
from dj_rest_auth.views import (
    LogoutView, UserDetailsView,
)
from django.urls import re_path

urlpatterns = [
    re_path(r'user/?$', UserDetailsView.as_view(), name='user_details'),

    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('auth/facebook/', FacebookLogin.as_view(), name='facebook_login'),
    path('auth/apple/', AppleLogin.as_view(), name='apple_login'),


    re_path(r'auth/logout/?$', LogoutView.as_view(), name='rest_logout'),
    re_path(r'auth/token/verify/?$', TokenVerifyView.as_view(), name='token_verify'),
    re_path(r'auth/token/refresh/?$', get_refresh_view().as_view(), name='token_refresh'),
]
