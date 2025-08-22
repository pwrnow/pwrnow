"""
URL configuration for Google OAuth authentication endpoints.
"""

from django.urls import path
from . import auth_views

app_name = 'auth'

urlpatterns = [
    # Google OAuth endpoints
    path('google/', auth_views.google_auth, name='google_auth'),
    path('google/code/', auth_views.google_auth_code, name='google_auth_code'),
    
    # JWT token management
    path('refresh/', auth_views.refresh_token, name='refresh_token'),
    
    # User profile management
    path('user/profile/', auth_views.user_profile, name='user_profile'),
    
    # Authentication status and logout
    path('status/', auth_views.auth_status, name='auth_status'),
    path('logout/', auth_views.logout, name='logout'),
    
    # Health check
    path('health/', auth_views.health_check, name='health_check'),
]