from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.db import models
from .models import Event, Category, Organization, Tag, OrganizationCode, Like, Post, PostImage, Schedule, ScheduleItem, QRCode, EventParticipation, EventMap, EventMapLocation, Friendship, FriendRequest
from .translation_utils import get_language_from_request, get_translated_field

import logging

logger = logging.getLogger(__name__)

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
    participation_status = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()
    event_map = serializers.SerializerMethodField()
    friends_interested = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'slug', 'title', 'description', 'starts_at', 'ends_at',
            'location', 'image_url', 'url', 'verified', 'verified_by', 'aspect_ratio',
            'organization', 'category', 'is_new', 'liked', 'participation_status', 'posts', 'schedule', 'event_map', 'friends_interested', 'likes_count'
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

        logger.info(f"Checking if user {user.id} liked event {obj.id}")
        # Efficient existence check
        return Like.objects.filter(user_id=user.id, event_id=obj.id).exists()

    def get_participation_status(self, obj):
        """Check if the current user has confirmed participation for this event."""
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        # Use annotated field if available (from optimized queryset)
        if hasattr(obj, 'user_participation_exists'):
            return obj.user_participation_exists

        # Fallback to direct query if annotation not available
        return EventParticipation.objects.filter(
            user_id=user.id,
            event_id=obj.id
        ).exists()

    def get_posts(self, obj):
        """Get posts for the event."""
        request = self.context.get('request')
        # Determine if current org owns the event
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(request)
        except Exception:
            current_org = None

        # Get posts - this will use prefetched data if available, otherwise make a query
        queryset = obj.posts.all().select_related('organization').prefetch_related('images').order_by('-created_at')
        if not (current_org and str(current_org.id) == str(obj.organization_id)):
            queryset = queryset.filter(verified=True)

        return PostSerializer(queryset, many=True, context={'request': request}).data

    def get_schedule(self, obj):
        """Get schedule for the event."""
        request = self.context.get('request')
        # Determine ownership similarly to posts
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(request)
        except Exception:
            current_org = None

        # Get schedule - this will use prefetched data if available, otherwise make a query
        schedule = getattr(obj, 'schedule', None)
        if not schedule:
            return None

        # Public can see schedule only if event is verified
        # For public users, events are already filtered to be verified in the queryset
        if not (current_org and str(current_org.id) == str(obj.organization_id)) and not obj.verified:
            return None

        return ScheduleSerializer(schedule, context={'request': request}).data

    def get_event_map(self, obj):
        """Get event map for the event."""
        request = self.context.get('request')
        # Determine if current org owns the event
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(request)
        except Exception:
            current_org = None

        # Get event map - this will use prefetched data if available, otherwise make a query
        event_map = getattr(obj, 'event_map', None)
        if not event_map or not event_map.is_active:
            return None

        # Public can see event map only if event is verified
        # For public users, events are already filtered to be verified in the queryset
        if not (current_org and str(current_org.id) == str(obj.organization_id)) and not obj.verified:
            return None

        return EventMapSerializer(event_map, context={'request': request}).data

    def get_friends_interested(self, obj):
        """Get friends who are interested in (have liked) this event."""
        from django.db import models
        from .models import Friendship, Like
        
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        # Return empty data if not authenticated
        if not user or not getattr(user, 'is_authenticated', False):
            return {'count': 0, 'friends': []}
        
        # Get current user's friendships
        friendships = Friendship.objects.filter(
            models.Q(user1=user) | models.Q(user2=user)
        ).values_list('user1_id', 'user2_id')
        
        friend_ids = set()
        for user1_id, user2_id in friendships:
            friend_ids.add(user1_id)
            friend_ids.add(user2_id)
        friend_ids.discard(user.id)
        
        # If no friends, return early
        if not friend_ids:
            return {'count': 0, 'friends': []}
        
        # Get friends who are interested in this event
        interested_friends = Like.objects.filter(
            event=obj,
            user_id__in=friend_ids
        ).select_related('user').values('user__id', 'user__username')
        
        # Format the response
        friends_list = [
            {'id': str(friend['user__id']), 'username': friend['user__username']}
            for friend in interested_friends
        ]
        
        return {
            'count': len(friends_list),
            'friends': friends_list
        }

    def get_likes_count(self, obj):
        """Get the total number of likes for this event (staff only)."""
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        
        # Only return likes count for staff users
        if not user or not getattr(user, 'is_authenticated', False) or not getattr(user, 'is_staff', False):
            return None
            
        return obj.likes_count


class EventCreateSerializer(serializers.ModelSerializer):
    category_slug = serializers.SlugField(write_only=True, required=False, allow_null=True, allow_blank=True)
    image = serializers.ImageField(write_only=True, required=False)
    publication_date = serializers.DateField(required=True)

    class Meta:
        model = Event
        fields = [
            'title', 'description', 'starts_at', 'ends_at', 'publication_date',
            'location', 'url', 'category_slug', 'image'
        ]
        extra_kwargs = {
            'title': {'max_length': 200, 'required': True},
            'description': {'max_length': 5000, 'required': False, 'allow_null': True, 'allow_blank': True},
            'location': {'max_length': 300, 'required': False, 'allow_null': True, 'allow_blank': True},
            'url': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate(self, data):
        """Validate that end time is after start time and publication date is in future. Also require image except for 'rekrutacja' category."""
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

        # Validate publication date is not later than start date
        if data.get('publication_date') and data.get('starts_at'):
            publication_date = data['publication_date']
            start_date = data['starts_at'].date()
            if publication_date > start_date:
                raise serializers.ValidationError({
                    'publication_date': _('Publication date cannot be later than the event start date.')
                })

        # Enforce image requirement except for 'rekrutacja' category
        category_slug = data.get('category_slug') or None
        # If instance doesn't carry slug, we rely on provided slug
        requires_image = True
        if category_slug:
            if str(category_slug).lower() == 'rekrutacja':
                requires_image = False
        # When creating, image may be provided in files under 'image' and is passed via validated_data as 'image'
        image = data.get('image')
        if requires_image and not image:
            raise serializers.ValidationError({'image': _('Image is required for this category.')})

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
    text = serializers.CharField(max_length=5000, required=False, allow_blank=True, allow_null=True)
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
    """
    EventDetailSerializer inherits from EventSerializer and includes posts and schedule.
    The base EventSerializer now handles posts and schedule with prefetch optimization.
    """
    pass


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
    description = serializers.CharField(max_length=2000, required=False, allow_blank=True, allow_null=True)

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


class QRCodeScanSerializer(serializers.Serializer):
    """Serializer for QR code scanning."""
    code = serializers.CharField(
        max_length=50,
        required=True,
        help_text="QR code that was scanned"
    )

    def validate_code(self, value):
        """Validate that the QR code exists and is active."""
        try:
            qr_code = QRCode.objects.get(code=value, is_active=True)
            return qr_code
        except QRCode.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive QR code.")


class EventMapLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventMapLocation
        fields = [
            'id', 'name', 'description', 'latitude', 'longitude',
            'address', 'order_index', 'image', 'is_active'
        ]


class EventMapSerializer(serializers.ModelSerializer):
    locations = EventMapLocationSerializer(many=True, read_only=True)
    locations_count = serializers.SerializerMethodField()

    class Meta:
        model = EventMap
        fields = [
            'id', 'title', 'description', 'is_active', 'locations', 'locations_count'
        ]

    def get_locations_count(self, obj):
        """Get the total number of active locations on this map."""
        return obj.locations.filter(is_active=True).count()


class EventMapCreateSerializer(serializers.Serializer):
    """Serializer for creating event maps."""
    event_slug = serializers.SlugField(required=True)
    title = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True, allow_null=True)
    locations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )

    def validate(self, attrs):
        """Validate the event map data."""
        event_slug = attrs.get('event_slug')
        if event_slug:
            try:
                event = Event.objects.get(slug=event_slug)
            except Event.DoesNotExist:
                raise serializers.ValidationError({'event_slug': _('Invalid event slug.')})

            # Check if event already has a map
            if hasattr(event, 'event_map'):
                raise serializers.ValidationError({'event_slug': _('Event already has a map.')})

            # Keep for create() to avoid re-query
            self._validated_event = event

        # Validate locations if provided
        locations = attrs.get('locations', [])
        for i, location in enumerate(locations):
            if 'name' not in location:
                raise serializers.ValidationError({f'locations[{i}].name': _('Location name is required.')})
            if 'latitude' not in location or 'longitude' not in location:
                raise serializers.ValidationError({f'locations[{i}].coordinates': _('Latitude and longitude are required.')})

            try:
                lat = float(location['latitude'])
                lng = float(location['longitude'])
                if lat < -90 or lat > 90:
                    raise serializers.ValidationError({f'locations[{i}].latitude': _('Latitude must be between -90 and 90 degrees.')})
                if lng < -180 or lng > 180:
                    raise serializers.ValidationError({f'locations[{i}].longitude': _('Longitude must be between -180 and 180 degrees.')})
            except (ValueError, TypeError):
                raise serializers.ValidationError({f'locations[{i}].coordinates': _('Invalid latitude or longitude values.')})

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

        # Create the event map
        event_map = EventMap.objects.create(
            event=event,
            title=validated_data['title'],
            description=validated_data.get('description') or None,
            is_active=True
        )

        # Create locations if provided
        locations = validated_data.get('locations', [])
        for index, location_data in enumerate(locations):
            EventMapLocation.objects.create(
                event_map=event_map,
                name=location_data['name'],
                description=location_data.get('description') or None,
                latitude=location_data['latitude'],
                longitude=location_data['longitude'],
                address=location_data.get('address') or None,
                order_index=location_data.get('order_index', index),
                is_active=True
            )

        return event_map


class EventMapLocationCreateSerializer(serializers.Serializer):
    """Serializer for adding locations to existing event maps."""
    event_slug = serializers.SlugField(required=True)
    name = serializers.CharField(max_length=200, required=True)
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True, allow_null=True)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=True)
    address = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    order_index = serializers.IntegerField(required=False, default=0)

    def validate(self, attrs):
        """Validate the location data."""
        event_slug = attrs.get('event_slug')
        if event_slug:
            try:
                event = Event.objects.get(slug=event_slug)
            except Event.DoesNotExist:
                raise serializers.ValidationError({'event_slug': _('Invalid event slug.')})

            if not hasattr(event, 'event_map'):
                raise serializers.ValidationError({'event_slug': _('Event does not have a map.')})

            if not event.event_map.is_active:
                raise serializers.ValidationError({'event_slug': _('Event map is not active.')})

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

        # Create the location
        location = EventMapLocation.objects.create(
            event_map=event.event_map,
            name=validated_data['name'],
            description=validated_data.get('description') or None,
            latitude=validated_data['latitude'],
            longitude=validated_data['longitude'],
            address=validated_data.get('address') or None,
            order_index=validated_data.get('order_index', 0),
            is_active=True
        )

        return location


class UserSearchSerializer(serializers.Serializer):
    """Serializer for searching users by username."""
    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    is_friend = serializers.BooleanField(read_only=True)
    has_pending_request = serializers.BooleanField(read_only=True)
    friendship_status = serializers.CharField(read_only=True)


class FriendRequestSerializer(serializers.ModelSerializer):
    """Serializer for friend requests."""
    from_user = serializers.SerializerMethodField()
    to_user = serializers.SerializerMethodField()
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']
    
    def get_from_user(self, obj):
        return {
            'id': str(obj.from_user.id),
            'username': obj.from_user.username,
        }
    
    def get_to_user(self, obj):
        return {
            'id': str(obj.to_user.id),
            'username': obj.to_user.username,
        }


class FriendRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating friend requests."""
    to_user_id = serializers.UUIDField(required=True)
    
    def validate_to_user_id(self, value):
        """Validate that the target user exists."""
        import logging
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        logger = logging.getLogger(__name__)
        logger.debug(f"FRIENDS_SERIALIZER_VALIDATE_USER_ID: Validating user ID {value}")
        
        try:
            user = User.objects.get(id=value)
            logger.debug(f"FRIENDS_SERIALIZER_VALIDATE_USER_ID_SUCCESS: User {user.username} found for ID {value}")
        except User.DoesNotExist:
            logger.warning(f"FRIENDS_SERIALIZER_VALIDATE_USER_ID_NOT_FOUND: User with ID {value} not found")
            raise serializers.ValidationError(_("User not found."))
        
        # Check if trying to send request to self
        request = self.context.get('request')
        if request and request.user.id == value:
            logger.warning(f"FRIENDS_SERIALIZER_VALIDATE_USER_ID_SELF: User {request.user.id} attempted to send friend request to themselves")
            raise serializers.ValidationError(_("You cannot send a friend request to yourself."))
        
        return value
    
    def validate(self, attrs):
        """Additional validation for friend requests."""
        import logging
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        logger = logging.getLogger(__name__)
        request = self.context.get('request')
        from_user = request.user
        to_user = User.objects.get(id=attrs['to_user_id'])
        
        logger.info(f"FRIENDS_SERIALIZER_VALIDATE: Validating friend request from {from_user.username} to {to_user.username}")
        
        # Check if users are already friends
        friendship_exists = Friendship.objects.filter(
            models.Q(user1=from_user, user2=to_user) |
            models.Q(user1=to_user, user2=from_user)
        ).exists()
        
        if friendship_exists:
            logger.warning(f"FRIENDS_SERIALIZER_VALIDATE_ALREADY_FRIENDS: Users {from_user.username} and {to_user.username} are already friends")
            raise serializers.ValidationError(_("You are already friends with this user."))
        
        # Check if there's already a pending request in either direction
        existing_request = FriendRequest.objects.filter(
            (models.Q(from_user=from_user, to_user=to_user) |
             models.Q(from_user=to_user, to_user=from_user)),
            status=FriendRequest.Status.PENDING
        ).first()
        
        if existing_request:
            if existing_request.from_user == from_user:
                logger.warning(f"FRIENDS_SERIALIZER_VALIDATE_DUPLICATE_SENT: User {from_user.username} already sent a friend request to {to_user.username}")
                raise serializers.ValidationError(_("You have already sent a friend request to this user."))
            else:
                logger.warning(f"FRIENDS_SERIALIZER_VALIDATE_DUPLICATE_RECEIVED: User {to_user.username} already sent a friend request to {from_user.username}")
                raise serializers.ValidationError(_("This user has already sent you a friend request. Please accept it instead."))
        
        logger.info(f"FRIENDS_SERIALIZER_VALIDATE_SUCCESS: Validation passed for friend request from {from_user.username} to {to_user.username}")
        return attrs
    
    def create(self, validated_data):
        import logging
        from django.contrib.auth import get_user_model
        from django.db import IntegrityError
        User = get_user_model()
        
        logger = logging.getLogger(__name__)
        request = self.context.get('request')
        to_user = User.objects.get(id=validated_data['to_user_id'])
        
        logger.info(f"FRIENDS_SERIALIZER_CREATE: Creating friend request from {request.user.username} to {to_user.username}")
        
        try:
            friend_request = FriendRequest.objects.create(
                from_user=request.user,
                to_user=to_user,
                status=FriendRequest.Status.PENDING
            )
            logger.info(f"FRIENDS_SERIALIZER_CREATE_SUCCESS: Friend request {friend_request.id} created successfully")
            return friend_request
        except IntegrityError as e:
            if 'duplicate key value violates unique constraint' in str(e):
                logger.warning(f"FRIENDS_SERIALIZER_CREATE_DUPLICATE: Duplicate friend request from {request.user.username} to {to_user.username}")
                raise serializers.ValidationError(_("You have already sent a friend request to this user."))
            else:
                logger.error(f"FRIENDS_SERIALIZER_CREATE_INTEGRITY_ERROR: Integrity error creating friend request: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"FRIENDS_SERIALIZER_CREATE_ERROR: Failed to create friend request: {str(e)}")
            raise


class FriendshipSerializer(serializers.Serializer):
    """Serializer for friendships (showing the friend's data)."""
    id = serializers.UUIDField(read_only=True)
    username = serializers.CharField(read_only=True)
    friendship_id = serializers.UUIDField(read_only=True)
    friendship_created_at = serializers.DateTimeField(read_only=True)