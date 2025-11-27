from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, ProfileImageChangeRequest
from django.core.validators import MinLengthValidator, RegexValidator


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    profile_image_url = serializers.SerializerMethodField()
    pending_profile_image_url = serializers.SerializerMethodField()

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
            'last_login',
            'profile_image_url',
            'pending_profile_image_url',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login', 'username_set_by_user', 'is_staff']

    def get_profile_image_url(self, obj):
        """Return the approved profile image URL."""
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None

    def get_pending_profile_image_url(self, obj):
        """Return pending profile image URL only for the user themselves."""
        request = self.context.get('request')
        # Only return pending image URL if viewing own profile
        if request and request.user and request.user.id == obj.id:
            pending_request = obj.pending_profile_image_request
            if pending_request:
                return request.build_absolute_uri(pending_request.image.url)
        return None


class PublicUserSerializer(serializers.ModelSerializer):
    """Serializer for User model when viewed by other users (no pending image)."""
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'profile_image_url',
        ]

    def get_profile_image_url(self, obj):
        """Return the approved profile image URL."""
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class ProfileImageChangeRequestSerializer(serializers.ModelSerializer):
    """Serializer for ProfileImageChangeRequest for admin listing."""
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    image_url = serializers.SerializerMethodField()
    reviewed_by_username = serializers.CharField(
        source='reviewed_by.username', read_only=True, allow_null=True
    )

    class Meta:
        model = ProfileImageChangeRequest
        fields = [
            'id',
            'user_id',
            'username',
            'user_email',
            'image_url',
            'status',
            'rejection_feedback',
            'created_at',
            'reviewed_at',
            'reviewed_by_username',
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at']

    def get_image_url(self, obj):
        """Return the image URL."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProfileImageUploadSerializer(serializers.Serializer):
    """Serializer for validating profile image upload."""
    image = serializers.ImageField()

    def validate_image(self, value):
        """Validate image file size and type."""
        # 5MB limit
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image size cannot exceed 5MB.")

        # Validate content type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                "Invalid image type. Allowed types: JPEG, PNG, GIF, WebP."
            )

        return value


class ProfileImageRejectSerializer(serializers.Serializer):
    """Serializer for rejecting a profile image with feedback."""
    feedback = serializers.CharField(min_length=1, max_length=500)


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
