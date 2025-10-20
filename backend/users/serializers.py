from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User
from django.core.validators import MinLengthValidator, RegexValidator


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'username_set_by_user',
            'is_staff',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login', 'username_set_by_user', 'is_staff']


class UsernameUpdateSerializer(serializers.Serializer):
    """Serializer for updating username with validation"""

    username = serializers.CharField(
        min_length=3,
        max_length=16,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_]+$',
                message='Username can only contain letters, numbers, and underscores'
            )
        ]
    )

    def validate_username(self, value):
        """Validate that username is unique and user hasn't already set it"""
        user = self.context['request'].user

        # Check if user has already set their username manually
        if user.username_set_by_user:
            raise serializers.ValidationError(
                "You have already set your username and cannot change it again."
            )

        # Check if username is already taken (excluding current user)
        if User.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError(
                "This username is already taken. Please choose another one."
            )

        return value

    def update(self, instance, validated_data):
        """Update username and mark as set by user"""
        instance.username = validated_data['username']
        instance.username_set_by_user = True
        instance.save()
        return instance


class UsernameCheckSerializer(serializers.Serializer):
    """Serializer for checking username availability"""

    username = serializers.CharField(
        min_length=3,
        max_length=16,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9_]+$',
                message='Username can only contain letters, numbers, and underscores'
            )
        ]
    )

    def validate_username(self, value):
        """Check if username is available"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT claims serializer that includes username_set_by_user field"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username_set_by_user'] = user.username_set_by_user
        token['username'] = user.username
        
        return token
