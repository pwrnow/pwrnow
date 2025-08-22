"""
Serializers for Google OAuth authentication endpoints.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class GoogleAuthRequestSerializer(serializers.Serializer):
    """Serializer for Google OAuth authentication request."""
    
    id_token = serializers.CharField(
        max_length=2048,
        help_text="Google OAuth ID token received from client"
    )
    platform = serializers.ChoiceField(
        choices=[('web', 'Web'), ('mobile', 'Mobile')],
        default='web',
        help_text="Platform initiating the authentication"
    )

    def validate_id_token(self, value):
        """Validate that the ID token is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("ID token cannot be empty")
        return value.strip()


class GoogleAuthCodeRequestSerializer(serializers.Serializer):
    """Serializer for Google OAuth authorization code request (alternative approach)."""
    
    code = serializers.CharField(
        max_length=1024,
        help_text="Google OAuth authorization code"
    )
    redirect_uri = serializers.URLField(
        help_text="Redirect URI used in OAuth flow"
    )
    platform = serializers.ChoiceField(
        choices=[('web', 'Web'), ('mobile', 'Mobile')],
        default='web',
        help_text="Platform initiating the authentication"
    )

    def validate_code(self, value):
        """Validate that the authorization code is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Authorization code cannot be empty")
        return value.strip()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'profile_picture_url',
            'auth_provider',
            'is_google_verified',
            'date_joined',
            'last_login'
        ]
        read_only_fields = [
            'id',
            'email',
            'auth_provider',
            'is_google_verified',
            'date_joined',
            'last_login'
        ]

    def to_representation(self, instance):
        """Custom representation to format datetime fields."""
        data = super().to_representation(instance)
        
        # Format datetime fields
        if data.get('date_joined'):
            data['date_joined'] = instance.date_joined.isoformat()
        if data.get('last_login'):
            data['last_login'] = instance.last_login.isoformat()
            
        return data


class GoogleAuthResponseSerializer(serializers.Serializer):
    """Serializer for Google authentication response."""
    
    user = UserProfileSerializer(read_only=True)
    tokens = serializers.DictField(
        child=serializers.CharField(),
        read_only=True,
        help_text="JWT access and refresh tokens"
    )
    message = serializers.CharField(
        read_only=True,
        required=False,
        help_text="Optional success message"
    )


class TokenRefreshRequestSerializer(serializers.Serializer):
    """Serializer for JWT token refresh request."""
    
    refresh = serializers.CharField(
        max_length=1024,
        help_text="JWT refresh token"
    )

    def validate_refresh(self, value):
        """Validate that the refresh token is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Refresh token cannot be empty")
        return value.strip()


class TokenRefreshResponseSerializer(serializers.Serializer):
    """Serializer for JWT token refresh response."""
    
    access = serializers.CharField(
        read_only=True,
        help_text="New JWT access token"
    )
    refresh = serializers.CharField(
        read_only=True,
        help_text="New JWT refresh token"
    )


class LogoutResponseSerializer(serializers.Serializer):
    """Serializer for logout response."""
    
    message = serializers.CharField(
        read_only=True,
        default="Successfully logged out"
    )


class GoogleUserSerializer(serializers.ModelSerializer):
    """Serializer for Google user data in responses."""
    
    full_name = serializers.SerializerMethodField()
    has_profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'profile_picture_url',
            'has_profile_picture',
            'auth_provider',
            'is_google_verified',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_full_name(self, obj):
        """Get user's full name."""
        return obj.get_full_name()

    def get_has_profile_picture(self, obj):
        """Check if user has a profile picture."""
        return obj.has_profile_picture()

    def to_representation(self, instance):
        """Custom representation to format datetime fields."""
        data = super().to_representation(instance)
        
        # Format datetime fields
        if data.get('date_joined'):
            data['date_joined'] = instance.date_joined.isoformat()
        if data.get('last_login'):
            data['last_login'] = instance.last_login.isoformat()
            
        return data


class ErrorResponseSerializer(serializers.Serializer):
    """Serializer for error responses."""
    
    error = serializers.CharField(
        read_only=True,
        help_text="Error message"
    )
    details = serializers.DictField(
        read_only=True,
        required=False,
        help_text="Additional error details"
    )
    code = serializers.CharField(
        read_only=True,
        required=False,
        help_text="Error code"
    )