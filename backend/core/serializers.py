from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import Event, Category, Organization, Tag, OrganizationCode, Like, Post, PostImage, Schedule, ScheduleItem
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
            raise serializers.ValidationError(_("Invalid authentication code"))

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
            'title', 'description', 'starts_at', 'ends_at', 'publication_date',
            'location', 'url', 'category_slug', 'image'
        ]
        extra_kwargs = {
            'title': {'max_length': 200, 'required': True},
            'description': {'required': False, 'allow_null': True, 'allow_blank': True},
            'location': {'max_length': 300, 'required': False, 'allow_null': True, 'allow_blank': True},
            'url': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate(self, data):
        """Validate that end time is after start time and publication date is in future"""
        if data.get('starts_at') and data.get('ends_at'):
            if data['ends_at'] <= data['starts_at']:
                raise serializers.ValidationError({
                    'ends_at': _('End time must be after start time.')
                })

        # Validate publication date is in the future (not today or past)
        if data.get('publication_date'):
            from django.utils import timezone
            today = timezone.now().date()
            if data['publication_date'] <= today:
                raise serializers.ValidationError({
                    'publication_date': _('Publication date must be in the future (not today or earlier).')
                })

        return data

    def validate_image(self, value):
        """Validate image size"""
        if value and value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError(_('Image size cannot exceed 5MB.'))
        return value

    def create(self, validated_data):
        # Get the authenticated organization from the new authentication system
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError(_('No request context found.'))

        # Use the new session-based authentication
        from .authentication import get_current_organization
        organization = get_current_organization(request)

        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # Get category if provided
        category = None
        category_slug = validated_data.pop('category_slug', None)
        if category_slug:
            try:
                category = Category.objects.get(slug=category_slug)
            except Category.DoesNotExist:
                raise serializers.ValidationError({'category_slug': _('Invalid category slug.')})

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


class PostImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = PostImage
        fields = ['id', 'url', 'aspect_ratio', 'order_index']

    def get_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class PostSerializer(serializers.ModelSerializer):
    images = PostImageSerializer(many=True, read_only=True)
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'created_at', 'text', 'organization', 'images', 'verified'
        ]


class PostCreateSerializer(serializers.Serializer):
    event_slug = serializers.SlugField(required=True)
    text = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    # Accept multiple images in multipart under key "images"
    images = serializers.ListField(
        child=serializers.ImageField(), required=False, allow_empty=True
    )

    def validate(self, attrs):
        text = attrs.get('text')
        images = attrs.get('images') or []
        text_present = bool(text and text.strip())
        images_present = len(images) > 0
        if not text_present and not images_present:
            raise serializers.ValidationError(_('Post must include text or at least one image.'))
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError(_('No request context found.'))

        from .authentication import get_current_organization
        organization = get_current_organization(request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        event_slug = validated_data['event_slug']
        try:
            event = Event.objects.get(slug=event_slug)
        except Event.DoesNotExist:
            raise serializers.ValidationError({'event_slug': _('Invalid event slug.')})

        # Only allow posting to own event
        if str(event.organization_id) != str(organization.id):
            raise serializers.ValidationError(_('You do not have permission to post to this event.'))

        text = validated_data.get('text')
        if text == '':
            text = None

        post = Post.objects.create(
            event=event,
            organization=organization,
            text=text,
            verified=False,
        )

        images = validated_data.get('images') or []
        for index, image in enumerate(images):
            PostImage.objects.create(post=post, image=image, order_index=index)

        return post


class EventDetailSerializer(EventSerializer):
    posts = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()

    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['posts', 'schedule']

    def get_posts(self, obj):
        request = self.context.get('request')
        # Determine if current org owns the event
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(request)
        except Exception:
            current_org = None

        queryset = obj.posts.all().select_related('organization').prefetch_related('images').order_by('-created_at')
        if not (current_org and str(current_org.id) == str(obj.organization_id)):
            queryset = queryset.filter(verified=True)

        return PostSerializer(queryset, many=True, context={'request': request}).data

    def get_schedule(self, obj):
        request = self.context.get('request')
        # Determine ownership similarly to posts
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(request)
        except Exception:
            current_org = None

        schedule = getattr(obj, 'schedule', None)
        if not schedule:
            return None

        # Public can see schedule only if event is verified
        if not (current_org and str(current_org.id) == str(obj.organization_id)) and not obj.verified:
            return None

        return ScheduleSerializer(schedule, context={'request': request}).data


class ScheduleItemSerializer(serializers.ModelSerializer):
    duration = serializers.SerializerMethodField()

    class Meta:
        model = ScheduleItem
        fields = [
            'id', 'date', 'start_time', 'end_time', 'title', 'description', 'duration'
        ]

    def get_duration(self, obj):
        minutes = obj.duration_minutes
        return f"{minutes} min"


class ScheduleSerializer(serializers.ModelSerializer):
    items = ScheduleItemSerializer(many=True, read_only=True)

    class Meta:
        model = Schedule
        fields = ['id', 'items']


class ScheduleItemCreateSerializer(serializers.Serializer):
    event_slug = serializers.SlugField(required=True)
    date = serializers.DateField(required=True)
    start_time = serializers.TimeField(required=True)
    end_time = serializers.TimeField(required=True)
    title = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError({'end_time': _('End time must be after start time.')})

        # Validate that provided date falls within the event's date range
        event_slug = attrs.get('event_slug')
        if event_slug:
            try:
                event = Event.objects.get(slug=event_slug)
            except Event.DoesNotExist:
                raise serializers.ValidationError({'event_slug': _('Invalid event slug.')})

            event_start_date = event.starts_at.date()
            event_end_date = event.ends_at.date()
            item_date = attrs['date']
            if item_date < event_start_date or item_date > event_end_date:
                raise serializers.ValidationError({
                    'date': _('Date must be within the event dates.')
                })

            # Keep for create() to avoid re-query
            self._validated_event = event

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError(_('No request context found.'))

        from .authentication import get_current_organization
        organization = get_current_organization(request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # Use event from validate(), or fetch if not present (safety)
        event = getattr(self, '_validated_event', None)
        if event is None:
            event_slug = validated_data['event_slug']
            try:
                event = Event.objects.get(slug=event_slug)
            except Event.DoesNotExist:
                raise serializers.ValidationError({'event_slug': _('Invalid event slug.')})

        if str(event.organization_id) != str(organization.id):
            raise serializers.ValidationError(_('You do not have permission to modify this event.'))

        schedule, created = Schedule.objects.get_or_create(event=event)

        description = validated_data.get('description')
        if description == '':
            description = None

        item = ScheduleItem.objects.create(
            schedule=schedule,
            date=validated_data['date'],
            start_time=validated_data['start_time'],
            end_time=validated_data['end_time'],
            title=validated_data['title'],
            description=description,
        )
        return item