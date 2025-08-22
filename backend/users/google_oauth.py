"""
Google OAuth authentication service for handling token verification and user management.
"""

import logging
from typing import Dict, Optional, Tuple
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests
from google.oauth2 import id_token
from google.auth.exceptions import GoogleAuthError
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()
logger = logging.getLogger(__name__)


class GoogleOAuthService:
    """Service class for handling Google OAuth authentication."""

    @staticmethod
    def verify_google_token(token: str) -> Optional[Dict]:
        """
        Verify Google OAuth token and return user information.
        
        Args:
            token (str): Google OAuth ID token
            
        Returns:
            Optional[Dict]: User information from Google if valid, None otherwise
        """
        try:
            # Verify the token against Google's OAuth 2.0 service
            idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH_CLIENT_ID
            )

            # Additional validation
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                logger.warning(f"Invalid token issuer: {idinfo['iss']}")
                return None

            if 'email' not in idinfo or not idinfo.get('email_verified', False):
                logger.warning("Email not verified or missing in Google token")
                return None

            logger.info(f"Successfully verified Google token for user: {idinfo['email']}")
            return idinfo

        except GoogleAuthError as e:
            logger.error(f"Google auth error during token verification: {str(e)}")
            return None
        except ValueError as e:
            logger.error(f"Invalid token format: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {str(e)}")
            return None

    @staticmethod
    def create_or_update_user(google_data: Dict) -> User:
        """
        Create a new user or update existing user with Google OAuth data.
        
        Args:
            google_data (Dict): User information from Google OAuth
            
        Returns:
            User: Created or updated user instance
        """
        email = google_data['email']
        google_id = google_data['sub']

        try:
            # Try to find user by Google ID first
            try:
                user = User.objects.get(google_id=google_id)
                logger.info(f"Found existing user by Google ID: {email}")
                
                # Update user information
                User.objects.update_user_google_info(user, google_data)
                return user
                
            except User.DoesNotExist:
                # Try to find user by email
                try:
                    user = User.objects.get(email=email)
                    logger.info(f"Found existing user by email, linking Google account: {email}")
                    
                    # Link Google account to existing user
                    User.objects.update_user_google_info(user, google_data)
                    return user
                    
                except User.DoesNotExist:
                    # Create new user
                    logger.info(f"Creating new user from Google OAuth: {email}")
                    user = User.objects.create_user_from_google(google_data)
                    return user

        except Exception as e:
            logger.error(f"Error creating/updating user from Google data: {str(e)}")
            raise

    @staticmethod
    def generate_jwt_tokens(user: User) -> Dict[str, str]:
        """
        Generate JWT access and refresh tokens for the user.
        
        Args:
            user (User): User instance
            
        Returns:
            Dict[str, str]: Dictionary containing access and refresh tokens
        """
        try:
            refresh = RefreshToken.for_user(user)
            
            # Add custom claims to the token
            refresh['email'] = user.email
            refresh['auth_provider'] = user.auth_provider
            refresh['is_google_verified'] = user.is_google_verified

            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        except Exception as e:
            logger.error(f"Error generating JWT tokens for user {user.email}: {str(e)}")
            raise

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[Dict[str, str]]:
        """
        Refresh JWT access token using refresh token.
        
        Args:
            refresh_token (str): JWT refresh token
            
        Returns:
            Optional[Dict[str, str]]: New tokens if refresh successful, None otherwise
        """
        try:
            refresh = RefreshToken(refresh_token)
            
            # Get user from token
            user_id = refresh['user_id']
            user = User.objects.get(id=user_id)
            
            # Generate new tokens
            return GoogleOAuthService.generate_jwt_tokens(user)
            
        except Exception as e:
            logger.error(f"Error refreshing access token: {str(e)}")
            return None

    @staticmethod
    def get_user_profile_data(user: User) -> Dict:
        """
        Get user profile data for API responses.
        
        Args:
            user (User): User instance
            
        Returns:
            Dict: User profile data
        """
        return {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_picture_url': user.profile_picture_url,
            'auth_provider': user.auth_provider,
            'is_google_verified': user.is_google_verified,
            'created_at': user.date_joined.isoformat() if user.date_joined else None,
            'last_login': user.last_login.isoformat() if user.last_login else None,
        }

    @staticmethod
    def validate_google_oauth_code(code: str, redirect_uri: str) -> Optional[Dict]:
        """
        Validate Google OAuth authorization code and get user info.
        
        Args:
            code (str): Google OAuth authorization code
            redirect_uri (str): Redirect URI used in OAuth flow
            
        Returns:
            Optional[Dict]: User information if validation successful, None otherwise
        """
        try:
            # This would typically use google-auth-oauthlib to exchange code for tokens
            # For now, we'll assume the frontend handles this and passes the ID token
            logger.warning("OAuth code validation not yet implemented - frontend should send ID token directly")
            return None
            
        except Exception as e:
            logger.error(f"Error validating Google OAuth code: {str(e)}")
            return None