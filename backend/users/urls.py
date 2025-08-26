from django.urls import path, include
from .views import GoogleLogin, FacebookLogin, AppleLogin

urlpatterns = [
    path('auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('auth/facebook/', FacebookLogin.as_view(), name='facebook_login'),
    path('auth/apple/', AppleLogin.as_view(), name='apple_login'),
]
