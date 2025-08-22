"""
Comprehensive tests for Google OAuth authentication backend functionality.
"""

import json
import uuid
from unittest.mock import Mock, patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from users.google_oauth import GoogleOAuthService
from users.auth_serializers import (
    GoogleAuthRequestSerializer,
    UserProfileSerializer,
    TokenRefreshRequestSerializer
)

User = get_user_model()


class GoogleOAuthServiceTests(TestCase):
    """Test cases for GoogleOAuthService class."""
    
    def setUp(self):
        self.mock_google_data = {
            'sub': 'google_user_123',
            'email': 'test@example.com',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://example.com/photo.jpg',
            'email_verified': True,
            'iss': 'accounts.google.com'
        }

    @patch('users.google_oauth.id_token.verify_oauth2_token')
    def test_verify_google_token_success(self, mock_verify):
        """Test successful Google token verification."""
        mock_verify.return_value = self.mock_google_data
        
        result = GoogleOAuthService.verify_google_token('valid_token')
        
        self.assertEqual(result, self.mock_google_data)
        mock_verify.assert_called_once()

    @patch('users.google_oauth.id_token.verify_oauth2_token')
    def test_verify_google_token_invalid_issuer(self, mock_verify):
        """Test Google token verification with invalid issuer."""
        invalid_data = self.mock_google_data.copy()
        invalid_data['iss'] = 'invalid.issuer.com'
        mock_verify.return_value = invalid_data
        
        result = GoogleOAuthService.verify_google_token('invalid_token')
        
        self.assertIsNone(result)

    @patch('users.google_oauth.id_token.verify_oauth2_token')
    def test_verify_google_token_unverified_email(self, mock_verify):
        """Test Google token verification with unverified email."""
        invalid_data = self.mock_google_data.copy()
        invalid_data['email_verified'] = False
        mock_verify.return_value = invalid_data
        
        result = GoogleOAuthService.verify_google_token('invalid_token')
        
        self.assertIsNone(result)

    @patch('users.google_oauth.id_token.verify_oauth2_token')
    def test_verify_google_token_exception(self, mock_verify):
        """Test Google token verification with exception."""
        mock_verify.side_effect = Exception('Token verification failed')
        
        result = GoogleOAuthService.verify_google_token('invalid_token')
        
        self.assertIsNone(result)

    def test_create_new_user_from_google(self):
        """Test creating a new user from Google OAuth data."""
        user = GoogleOAuthService.create_or_update_user(self.mock_google_data)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.google_id, 'google_user_123')
        self.assertEqual(user.first_name, 'John')
        self.assertEqual(user.last_name, 'Doe')
        self.assertEqual(user.auth_provider, 'google')
        self.assertTrue(user.is_google_verified)
        self.assertEqual(user.profile_picture_url, 'https://example.com/photo.jpg')

    def test_update_existing_user_by_google_id(self):
        """Test updating existing user found by Google ID."""
        # Create user with Google ID
        user = User.objects.create_user_from_google(self.mock_google_data)
        original_id = user.id
        
        # Update with new data
        updated_data = self.mock_google_data.copy()
        updated_data['given_name'] = 'Jane'
        updated_data['picture'] = 'https://example.com/new_photo.jpg'
        
        updated_user = GoogleOAuthService.create_or_update_user(updated_data)
        
        self.assertEqual(updated_user.id, original_id)
        self.assertEqual(updated_user.first_name, 'Jane')
        self.assertEqual(updated_user.profile_picture_url, 'https://example.com/new_photo.jpg')

    def test_link_google_to_existing_email_user(self):
        """Test linking Google account to existing user with same email."""
        # Create user with email but no Google ID
        user = User.objects.create_user(
            email='test@example.com',
            first_name='John',
            last_name='Smith'
        )
        original_id = user.id
        
        linked_user = GoogleOAuthService.create_or_update_user(self.mock_google_data)
        
        self.assertEqual(linked_user.id, original_id)
        self.assertEqual(linked_user.google_id, 'google_user_123')
        self.assertEqual(linked_user.auth_provider, 'google')
        self.assertTrue(linked_user.is_google_verified)

    def test_generate_jwt_tokens(self):
        """Test JWT token generation for user."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        
        tokens = GoogleOAuthService.generate_jwt_tokens(user)
        
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        self.assertIsInstance(tokens['access'], str)
        self.assertIsInstance(tokens['refresh'], str)

    def test_get_user_profile_data(self):
        """Test getting user profile data for API responses."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        
        profile_data = GoogleOAuthService.get_user_profile_data(user)
        
        self.assertEqual(profile_data['email'], 'test@example.com')
        self.assertEqual(profile_data['auth_provider'], 'google')
        self.assertTrue(profile_data['is_google_verified'])
        self.assertIn('id', profile_data)
        self.assertIn('created_at', profile_data)


class GoogleAuthAPITests(APITestCase):
    """Test cases for Google authentication API endpoints."""
    
    def setUp(self):
        self.google_auth_url = reverse('auth:google_auth')
        self.refresh_url = reverse('auth:refresh_token')
        self.profile_url = reverse('auth:user_profile')
        self.logout_url = reverse('auth:logout')
        
        self.mock_google_data = {
            'sub': 'google_user_123',
            'email': 'test@example.com',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://example.com/photo.jpg',
            'email_verified': True,
            'iss': 'accounts.google.com'
        }

    @patch('users.auth_views.GoogleOAuthService.verify_google_token')
    @patch('users.auth_views.GoogleOAuthService.create_or_update_user')
    @patch('users.auth_views.GoogleOAuthService.generate_jwt_tokens')
    def test_google_auth_success(self, mock_generate_tokens, mock_create_user, mock_verify_token):
        """Test successful Google authentication."""
        # Setup mocks
        mock_verify_token.return_value = self.mock_google_data
        user = User.objects.create_user_from_google(self.mock_google_data)
        mock_create_user.return_value = user
        mock_generate_tokens.return_value = {
            'access': 'test_access_token',
            'refresh': 'test_refresh_token'
        }
        
        data = {
            'id_token': 'valid_google_token',
            'platform': 'web'
        }
        
        response = self.client.post(self.google_auth_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')

    def test_google_auth_invalid_token(self):
        """Test Google authentication with invalid token."""
        data = {
            'id_token': '',
            'platform': 'web'
        }
        
        response = self.client.post(self.google_auth_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    @patch('users.auth_views.GoogleOAuthService.verify_google_token')
    def test_google_auth_token_verification_failed(self, mock_verify_token):
        """Test Google authentication when token verification fails."""
        mock_verify_token.return_value = None
        
        data = {
            'id_token': 'invalid_token',
            'platform': 'web'
        }
        
        response = self.client.post(self.google_auth_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_token_refresh_success(self):
        """Test successful JWT token refresh."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        refresh = RefreshToken.for_user(user)
        
        data = {
            'refresh': str(refresh)
        }
        
        response = self.client.post(self.refresh_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_token_refresh_invalid_token(self):
        """Test JWT token refresh with invalid token."""
        data = {
            'refresh': 'invalid_refresh_token'
        }
        
        response = self.client.post(self.refresh_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_get_user_profile_authenticated(self):
        """Test getting user profile when authenticated."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['auth_provider'], 'google')

    def test_get_user_profile_unauthenticated(self):
        """Test getting user profile when not authenticated."""
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_user_profile(self):
        """Test updating user profile."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        self.client.force_authenticate(user=user)
        
        data = {
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
        
        response = self.client.patch(self.profile_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Jane')
        self.assertEqual(response.data['last_name'], 'Smith')
        
        # Verify in database
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Jane')
        self.assertEqual(user.last_name, 'Smith')

    def test_logout_authenticated(self):
        """Test logout when authenticated."""
        user = User.objects.create_user_from_google(self.mock_google_data)
        self.client.force_authenticate(user=user)
        
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_logout_unauthenticated(self):
        """Test logout when not authenticated."""
        response = self.client.post(self.logout_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserModelTests(TestCase):
    """Test cases for extended User model functionality."""
    
    def setUp(self):
        self.google_data = {
            'sub': 'google_user_123',
            'email': 'test@example.com',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://example.com/photo.jpg'
        }

    def test_create_user_from_google(self):
        """Test creating user from Google OAuth data."""
        user = User.objects.create_user_from_google(self.google_data)
        
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.google_id, 'google_user_123')
        self.assertEqual(user.auth_provider, 'google')
        self.assertTrue(user.is_google_verified)
        self.assertFalse(user.has_usable_password())

    def test_update_user_google_info(self):
        """Test updating user with Google OAuth info."""
        user = User.objects.create_user(email='test@example.com')
        
        User.objects.update_user_google_info(user, self.google_data)
        
        self.assertEqual(user.google_id, 'google_user_123')
        self.assertEqual(user.auth_provider, 'google')
        self.assertTrue(user.is_google_verified)

    def test_user_is_google_user(self):
        """Test is_google_user method."""
        google_user = User.objects.create_user_from_google(self.google_data)
        email_user = User.objects.create_user(email='email@example.com')
        
        self.assertTrue(google_user.is_google_user())
        self.assertFalse(email_user.is_google_user())

    def test_user_has_profile_picture(self):
        """Test has_profile_picture method."""
        user_with_picture = User.objects.create_user_from_google(self.google_data)
        user_without_picture = User.objects.create_user(email='test@example.com')
        
        self.assertTrue(user_with_picture.has_profile_picture())
        self.assertFalse(user_without_picture.has_profile_picture())

    def test_user_get_full_name(self):
        """Test get_full_name method."""
        user = User.objects.create_user_from_google(self.google_data)
        
        self.assertEqual(user.get_full_name(), 'John Doe')


class SerializerTests(TestCase):
    """Test cases for authentication serializers."""
    
    def test_google_auth_request_serializer_valid(self):
        """Test GoogleAuthRequestSerializer with valid data."""
        data = {
            'id_token': 'valid_google_token',
            'platform': 'web'
        }
        
        serializer = GoogleAuthRequestSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['id_token'], 'valid_google_token')
        self.assertEqual(serializer.validated_data['platform'], 'web')

    def test_google_auth_request_serializer_invalid(self):
        """Test GoogleAuthRequestSerializer with invalid data."""
        data = {
            'id_token': '',
            'platform': 'invalid_platform'
        }
        
        serializer = GoogleAuthRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('id_token', serializer.errors)
        self.assertIn('platform', serializer.errors)

    def test_user_profile_serializer(self):
        """Test UserProfileSerializer."""
        google_data = {
            'sub': 'google_user_123',
            'email': 'test@example.com',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://example.com/photo.jpg'
        }
        user = User.objects.create_user_from_google(google_data)
        
        serializer = UserProfileSerializer(user)
        
        self.assertEqual(serializer.data['email'], 'test@example.com')
        self.assertEqual(serializer.data['auth_provider'], 'google')
        self.assertTrue(serializer.data['is_google_verified'])

    def test_token_refresh_request_serializer_valid(self):
        """Test TokenRefreshRequestSerializer with valid data."""
        data = {
            'refresh': 'valid_refresh_token'
        }
        
        serializer = TokenRefreshRequestSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['refresh'], 'valid_refresh_token')

    def test_token_refresh_request_serializer_invalid(self):
        """Test TokenRefreshRequestSerializer with invalid data."""
        data = {
            'refresh': ''
        }
        
        serializer = TokenRefreshRequestSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('refresh', serializer.errors)


class IntegrationTests(APITestCase):
    """Integration tests for complete authentication flow."""
    
    @patch('users.auth_views.GoogleOAuthService.verify_google_token')
    def test_complete_authentication_flow(self, mock_verify_token):
        """Test complete authentication flow from login to logout."""
        mock_google_data = {
            'sub': 'google_user_123',
            'email': 'test@example.com',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://example.com/photo.jpg',
            'email_verified': True,
            'iss': 'accounts.google.com'
        }
        mock_verify_token.return_value = mock_google_data
        
        # 1. Google Authentication
        auth_data = {
            'id_token': 'valid_google_token',
            'platform': 'web'
        }
        
        auth_response = self.client.post(
            reverse('auth:google_auth'),
            auth_data,
            format='json'
        )
        
        self.assertEqual(auth_response.status_code, status.HTTP_200_OK)
        self.assertIn('user', auth_response.data)
        self.assertIn('tokens', auth_response.data)
        
        # 2. Access Protected Resource
        access_token = auth_response.data['tokens']['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        profile_response = self.client.get(reverse('auth:user_profile'))
        self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_response.data['email'], 'test@example.com')
        
        # 3. Update Profile
        update_data = {
            'first_name': 'Jane'
        }
        
        update_response = self.client.patch(
            reverse('auth:user_profile'),
            update_data,
            format='json'
        )
        
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['first_name'], 'Jane')
        
        # 4. Token Refresh
        refresh_token = auth_response.data['tokens']['refresh']
        refresh_data = {
            'refresh': refresh_token
        }
        
        refresh_response = self.client.post(
            reverse('auth:refresh_token'),
            refresh_data,
            format='json'
        )
        
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh_response.data)
        
        # 5. Logout
        logout_response = self.client.post(reverse('auth:logout'))
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)
        
        # Verify user exists in database
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.first_name, 'Jane')
        self.assertEqual(user.auth_provider, 'google')
        self.assertTrue(user.is_google_verified)