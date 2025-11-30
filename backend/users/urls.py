from django.urls import path, include
from .views import (
    GoogleLogin, FacebookLogin, AppleLogin,
    UsernameUpdateView, UsernameCheckView,
    CustomTokenVerifyView, CustomTokenRefreshView,
    ProfileImageView,
    ProfileImageRequestListView, ProfileImageRequestApproveView,
    ProfileImageRequestRejectView,
)
from dj_rest_auth.views import (
    LogoutView, UserDetailsView,
)
from django.urls import re_path

urlpatterns = [
    re_path(r'user/?$', UserDetailsView.as_view(), name='user_details'),

    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('auth/facebook/', FacebookLogin.as_view(), name='facebook_login'),
    path('auth/apple/', AppleLogin.as_view(), name='apple_login'),

    # Username management
    path('user/username/', UsernameUpdateView.as_view(), name='username_update'),
    path('user/username/check/', UsernameCheckView.as_view(), name='username_check'),

    # Profile image management
    path('user/profile-image/', ProfileImageView.as_view(), name='profile_image'),

    # Profile image request management (staff only)
    path('profile-image-requests/', ProfileImageRequestListView.as_view(), name='profile_image_requests_list'),
    path('profile-image-requests/<uuid:request_id>/approve/', ProfileImageRequestApproveView.as_view(), name='profile_image_request_approve'),
    path('profile-image-requests/<uuid:request_id>/reject/', ProfileImageRequestRejectView.as_view(), name='profile_image_request_reject'),

    re_path(r'auth/logout/?$', LogoutView.as_view(), name='rest_logout'),
    re_path(r'auth/token/verify/?$', CustomTokenVerifyView.as_view(), name='token_verify'),
    re_path(r'auth/token/refresh/?$', CustomTokenRefreshView.as_view(), name='token_refresh'),
]
