"""
Google OAuth authentication views for Django REST Framework.
"""

import logging
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .google_oauth import GoogleOAuthService
from .auth_serializers import (
    GoogleAuthRequestSerializer,
    GoogleAuthCodeRequestSerializer,
    GoogleAuthResponseSerializer,
    TokenRefreshRequestSerializer,
    TokenRefreshResponseSerializer,
    UserProfileSerializer,
    LogoutResponseSerializer,
    ErrorResponseSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Authenticate user with Google OAuth ID token.
    
    POST /api/auth/google/
    """
    serializer = GoogleAuthRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Invalid request data',
            'details': serializer.errors
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_400_BAD_REQUEST
        )

    id_token = serializer.validated_data['id_token']
    platform = serializer.validated_data['platform']

    try:
        # Verify Google token
        google_data = GoogleOAuthService.verify_google_token(id_token)
        
        if not google_data:
            error_serializer = ErrorResponseSerializer(data={
                'error': 'Invalid Google token',
                'code': 'INVALID_TOKEN'
            })
            error_serializer.is_valid()
            return Response(
                error_serializer.data,
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Create or update user
        user = GoogleOAuthService.create_or_update_user(google_data)
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

        # Generate JWT tokens
        tokens = GoogleOAuthService.generate_jwt_tokens(user)

        # Prepare response
        response_data = {
            'user': user,
            'tokens': tokens,
            'message': 'Authentication successful'
        }

        response_serializer = GoogleAuthResponseSerializer(data=response_data)
        response_serializer.is_valid()

        logger.info(f"Successful Google authentication for user: {user.email} from {platform}")
        
        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error during Google authentication: {str(e)}")
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Authentication failed',
            'code': 'AUTH_ERROR'
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth_code(request):
    """
    Authenticate user with Google OAuth authorization code (alternative endpoint).
    
    POST /api/auth/google/code/
    """
    serializer = GoogleAuthCodeRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Invalid request data',
            'details': serializer.errors
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_400_BAD_REQUEST
        )

    # This endpoint is for future implementation
    # Currently, we recommend using ID token approach
    error_serializer = ErrorResponseSerializer(data={
        'error': 'Authorization code flow not yet implemented',
        'code': 'NOT_IMPLEMENTED'
    })
    error_serializer.is_valid()
    return Response(
        error_serializer.data,
        status=status.HTTP_501_NOT_IMPLEMENTED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh JWT access token using refresh token.
    
    POST /api/auth/refresh/
    """
    serializer = TokenRefreshRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Invalid request data',
            'details': serializer.errors
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_400_BAD_REQUEST
        )

    refresh_token_str = serializer.validated_data['refresh']

    try:
        # Create refresh token instance
        refresh = RefreshToken(refresh_token_str)
        
        # Get new access token
        access_token = refresh.access_token
        
        # Rotate refresh token for security
        refresh.blacklist()
        new_refresh = RefreshToken.for_user(refresh.user)

        response_data = {
            'access': str(access_token),
            'refresh': str(new_refresh)
        }

        response_serializer = TokenRefreshResponseSerializer(data=response_data)
        response_serializer.is_valid()

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK
        )

    except TokenError as e:
        logger.warning(f"Token refresh failed: {str(e)}")
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Invalid or expired refresh token',
            'code': 'INVALID_REFRESH_TOKEN'
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f"Error during token refresh: {str(e)}")
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Token refresh failed',
            'code': 'REFRESH_ERROR'
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update current authenticated user profile.
    
    GET /api/auth/user/profile/
    PATCH /api/auth/user/profile/
    """
    user = request.user

    if request.method == 'GET':
        # Get user profile
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        # Update user profile
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        
        if not serializer.is_valid():
            error_serializer = ErrorResponseSerializer(data={
                'error': 'Invalid data',
                'details': serializer.errors
            })
            error_serializer.is_valid()
            return Response(
                error_serializer.data,
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()
        logger.info(f"User profile updated: {user.email}")
        
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout current user by blacklisting refresh token.
    
    POST /api/auth/logout/
    """
    try:
        # Get refresh token from request body or header
        refresh_token_str = request.data.get('refresh_token')
        
        if refresh_token_str:
            try:
                refresh_token = RefreshToken(refresh_token_str)
                refresh_token.blacklist()
            except TokenError:
                # Token might already be blacklisted or invalid
                pass

        response_data = {'message': 'Successfully logged out'}
        response_serializer = LogoutResponseSerializer(data=response_data)
        response_serializer.is_valid()

        logger.info(f"User logged out: {request.user.email}")
        
        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        error_serializer = ErrorResponseSerializer(data={
            'error': 'Logout failed',
            'code': 'LOGOUT_ERROR'
        })
        error_serializer.is_valid()
        return Response(
            error_serializer.data,
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def auth_status(request):
    """
    Check authentication status of current user.
    
    GET /api/auth/status/
    """
    user = request.user
    
    response_data = {
        'authenticated': True,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'auth_provider': user.auth_provider,
            'is_google_verified': user.is_google_verified,
        }
    }
    
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for Google authentication service.
    
    GET /api/auth/health/
    """
    return Response(
        {'status': 'healthy', 'service': 'google-auth'},
        status=status.HTTP_200_OK
    )