from rest_framework import serializers
from .models import Event, Category, Organization, Tag, OrganizationCode, Like
from .translation_utils import get_language_from_request, get_translated_field


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['name', 'slug']

    def get_name(self, obj):
        """Get category name in the requested language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return get_translated_field(obj, 'name', language)


class OrganizationSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class OrganizationAuthSerializer(serializers.Serializer):
    """Serializer for organization authentication using code"""
    code = serializers.CharField(
        max_length=12,
        min_length=1,
        required=True,
        help_text="Organization authentication code"
    )

    def validate_code(self, value):
        """Validate that the code exists and return the organization"""
        try:
            org_code = OrganizationCode.objects.get(code=value)
            self.organization = org_code.organization
            return value
        except OrganizationCode.DoesNotExist:
            raise serializers.ValidationError("Invalid authentication code")

    def get_organization(self):
        """Return the organization after validation"""
        return getattr(self, 'organization', None)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['name', 'slug']


class EventSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    is_new = serializers.SerializerMethodField()
    liked = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'slug', 'title', 'description', 'starts_at', 'ends_at',
            'location', 'image_url', 'url', 'verified', 'aspect_ratio',
            'organization', 'category', 'is_new', 'liked'
        ]

    def get_title(self, obj):
        """Get event title in the requested language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return get_translated_field(obj, 'title', language)

    def get_description(self, obj):
        """Get event description in the requested language."""
        request = self.context.get('request')
        language = get_language_from_request(request)
        return get_translated_field(obj, 'description', language)

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None

    def get_is_new(self, obj):
        """
        Check if the event is new.
        Uses the annotated value from the queryset if available,
        otherwise calls the model's check_is_new() method.
        """
        if hasattr(obj, 'is_new'):
            return obj.is_new
        return obj.check_is_new()

    def get_liked(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        # Efficient existence check
        return Like.objects.filter(user_id=user.id, event_id=obj.id).exists()


class EventCreateSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(write_only=True, required=False, allow_null=True, allow_blank=True)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'starts_at', 'ends_at',
            'location', 'url', 'category_slug', 'image'
        ]
        extra_kwargs = {
            'title': {'max_length': 200, 'required': True},
            'description': {'required': False, 'allow_null': True, 'allow_blank': True},
            'location': {'max_length': 300, 'required': False, 'allow_null': True, 'allow_blank': True},
            'url': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate(self, data):
        """Validate that end time is after start time"""
        if data.get('starts_at') and data.get('ends_at'):
            if data['ends_at'] <= data['starts_at']:
                raise serializers.ValidationError({
                    'ends_at': 'End time must be after start time.'
                })
        return data

    def validate_image(self, value):
        """Validate image size"""
        if value and value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError('Image size cannot exceed 5MB.')
        return value

    def create(self, validated_data):
        # Get the authenticated organization from the new authentication system
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError('No request context found.')

        # Use the new session-based authentication
        from .authentication import get_current_organization
        organization = get_current_organization(request)

        if not organization:
            raise serializers.ValidationError('No authenticated organization found.')

        # Get category if provided
        category = None
        category_slug = validated_data.pop('category_slug', None)
        if category_slug:
            try:
                category = Category.objects.get(slug=category_slug)
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category_slug': 'Invalid category slug.'})

        # Clean empty strings to None for nullable fields
        for field in ['description', 'location', 'url']:
            if validated_data.get(field) == '':
                validated_data[field] = None

        # Create the event
        event = Event.objects.create(
            organization=organization,
            category=category,
            verified=False,  # Events start as unverified
            **validated_data
        )

        return event