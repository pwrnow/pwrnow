from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, Category, Organization, Tag, Like, Post, ScheduleItem, EventParticipation, EventMap, EventMapLocation
from .serializers import (
    EventSerializer,
    EventDetailSerializer,
    CategorySerializer,
    OrganizationSerializer,
    OrganizationAuthSerializer,
    TagSerializer,
    EventCreateSerializer,
    PostSerializer,
    PostCreateSerializer,
    ScheduleSerializer,
    ScheduleItemSerializer,
    ScheduleItemCreateSerializer,
    QRCodeScanSerializer,
    EventMapSerializer,
    EventMapCreateSerializer,
    EventMapLocationSerializer,
    EventMapLocationCreateSerializer,
)
from .authentication import (
    authenticate_organization,
    get_current_organization,
    clear_organization_session,
    OrganizationAuthenticationMixin
)
from .tasks import send_discord_notification
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext as _


class CategoryViewSet(viewsets.GenericViewSet):
    """
    ViewSet for listing categories only (no single category retrieval)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def list(self, request, *args, **kwargs):
        """List all categories ordered by order_index and name."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing organizations
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    lookup_field = 'slug'
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], authentication_classes=[], parser_classes=[JSONParser])
    def authenticate(self, request):
        """
        Authenticate organization using a code and store in session
        PUBLIC ENDPOINT - No authentication required
        """
        serializer = OrganizationAuthSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid request data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use the new session-based authentication
        organization = authenticate_organization(
            request,
            serializer.validated_data['code']
        )

        if not organization:
            return Response(
                {'error': 'Authentication failed'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Return organization data
        org_serializer = self.get_serializer(organization, context={'request': request})
        return Response({
            'organization': org_serializer.data,
            'message': 'Successfully authenticated'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny], parser_classes=[JSONParser])
    def logout(self, request):
        """
        Clear organization authentication from session
        PUBLIC ENDPOINT - No authentication required
        """
        clear_organization_session(request)
        return Response({
            'message': _('Successfully logged out')
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def current(self, request):
        """
        Get current authenticated organization
        PUBLIC ENDPOINT - Returns organization if session exists, 401 if not
        """
        organization = get_current_organization(request)
        if not organization:
            return Response(
                {'error': _('No organization authenticated')},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = self.get_serializer(organization, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def image(self, request, slug=None):
        """
        Upload organization image
        REQUIRES ORGANIZATION AUTHENTICATION
        """
        # Check if user is authenticated for this organization
        current_org = get_current_organization(request)
        if not current_org:
            return Response(
                {'error': _('No organization authenticated')},
                status=status.HTTP_401_UNAUTHORIZED
            )

        organization = self.get_object()

        # Verify the authenticated org matches the requested org
        if str(organization.id) != str(current_org.id):
            return Response(
                {'error': _('Access denied')},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'image' not in request.FILES:
            return Response(
                {'error': _('No image file provided')},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['image']

        # Validate image size (5MB limit)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': _('Image size cannot exceed 5MB')},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update organization image
        organization.image = image_file
        organization.save()

        # Return updated organization data
        serializer = self.get_serializer(organization, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing tags
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]
    authentication_classes = []


class EventViewSet(OrganizationAuthenticationMixin, viewsets.ModelViewSet):
    """
    ViewSet for listing and creating events with filtering and search capabilities
    PUBLIC READ ACCESS - Anyone can view events
    ORGANIZATION AUTH REQUIRED - For creating events
    Only create, list, and retrieve are allowed.
    """
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category__slug']
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        if self.action == 'retrieve':
            return EventDetailSerializer
        return EventSerializer



    def get_queryset(self):
        """Optimized version with better database performance"""
        now = timezone.now()
        today = now.date()

        # Use raw SQL for better performance on large datasets
        queryset = Event.objects.select_related('category', 'organization').prefetch_related('tags')

        # For retrieve action, prefetch posts and schedule to avoid N+1 queries
        if self.action == 'retrieve':
            queryset = queryset.select_related('schedule').prefetch_related(
                'posts__organization',
                'posts__images',
                'schedule__items'
            )

        current_org = self.get_current_organization()
        if current_org:
            queryset = queryset.filter(organization__id=current_org.id)
        else:
            # Apply filters first, then annotations
            # Only show events that are published today or in the past
            today = timezone.now().date()
            queryset = queryset.filter(
                verified=True,
                ends_at__gte=now,
                publication_date__lte=today
            )

        # Add participation status annotation for authenticated users
        request = self.request
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            from django.db.models import Exists, OuterRef
            queryset = queryset.annotate(
                user_participation_exists=Exists(
                    EventParticipation.objects.filter(
                        user=request.user,
                        event=OuterRef('pk')
                    )
                )
            )

        # Simpler ordering - avoid complex CASE statements
        return queryset.extra(
            select={
                'is_today': "DATE(starts_at) <= %s AND DATE(ends_at) >= %s",
                'is_new': "publication_date = %s"
            },
            select_params=[today, today, today],
            order_by=['-is_today', '-is_new', 'starts_at']
        )

    def list(self, request, *args, **kwargs):
        """List events with filtering support."""
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        Create a new event (requires authenticated organization)
        ORGANIZATION AUTH REQUIRED
        """
        # Check if organization is authenticated using our session-based auth
        self.check_organization_authentication()

        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            event = serializer.save()

            # Send Discord notification unless suppressed via settings
            if not (getattr(settings, "SUPPRESS_NOTIFICATIONS", False) or getattr(settings, "SUPPRESS_DISCORD_NOTIFICATIONS", False)):
                send_discord_notification.delay(str(event.id))

            # Return the created event using the read serializer
            read_serializer = EventSerializer(event, context={'request': request})
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        return Response({'detail': 'Method "PUT" not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def partial_update(self, request, *args, **kwargs):
        return Response({'detail': 'Method "PATCH" not allowed.'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        organization = self.get_current_organization()
        if not organization:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        event = self.get_object()
        if not event.organization or event.organization.id != organization.id:
            return Response({'detail': 'You do not have permission to delete this event.'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(event)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='posts', permission_classes=[AllowAny])
    def list_posts(self, request, slug=None):
        """
        List posts for a given event by slug.
        Public: returns only verified posts.
        If an organization is authenticated and owns the event, include unverified as well.
        """
        event = self.get_object()
        current_org = self.get_current_organization()

        queryset = event.posts.select_related('organization').prefetch_related('images').order_by('-created_at')
        if not (current_org and str(current_org.id) == str(event.organization_id)):
            queryset = queryset.filter(verified=True)

        page = self.paginate_queryset(queryset)
        serializer = PostSerializer(page or queryset, many=True, context={'request': request})
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='schedule', permission_classes=[AllowAny])
    def get_schedule(self, request, slug=None):
        """
        Return the schedule for this event.
        - Public: only if event is verified
        - Owner org: return schedule regardless of verification
        """
        event = self.get_object()
        current_org = self.get_current_organization()

        if not (current_org and str(current_org.id) == str(event.organization_id)) and not event.verified:
            return Response({'detail': _('Event not verified.')}, status=status.HTTP_404_NOT_FOUND)

        schedule = getattr(event, 'schedule', None)
        if not schedule:
            return Response(None, status=status.HTTP_200_OK)

        serializer = ScheduleSerializer(schedule, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PostViewSet(OrganizationAuthenticationMixin, viewsets.GenericViewSet):
    """
    Web-only endpoints for creating and deleting posts.
    Requires organization authentication.
    """
    queryset = Post.objects.all().select_related('event', 'organization').prefetch_related('images')
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return PostCreateSerializer
        return PostSerializer

    def create(self, request, *args, **kwargs):
        self.check_organization_authentication()
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        read_serializer = PostSerializer(post, context={'request': request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        organization = self.get_current_organization()
        if not organization:
            return Response({'detail': _('Authentication required.')}, status=status.HTTP_401_UNAUTHORIZED)
        post = self.get_object()
        if not post.organization or str(post.organization_id) != str(organization.id):
            return Response({'detail': _('You do not have permission to delete this post.')}, status=status.HTTP_403_FORBIDDEN)
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleItemViewSet(OrganizationAuthenticationMixin, viewsets.GenericViewSet):
    """
    Endpoints for creating and deleting schedule items.
    Requires organization authentication and ownership of the event/schedule.
    """
    queryset = ScheduleItem.objects.select_related('schedule__event')
    parser_classes = [JSONParser]
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == 'create':
            return ScheduleItemCreateSerializer
        return ScheduleItemSerializer

    def create(self, request, *args, **kwargs):
        self.check_organization_authentication()
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        read = ScheduleItemSerializer(item, context={'request': request})
        return Response(read.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        organization = self.get_current_organization()
        if not organization:
            return Response({'detail': _('Authentication required.')}, status=status.HTTP_401_UNAUTHORIZED)
        item = self.get_object()
        event_org_id = str(item.schedule.event.organization_id)
        if event_org_id != str(organization.id):
            return Response({'detail': _('You do not have permission to delete this schedule item.')}, status=status.HTTP_403_FORBIDDEN)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def event_like(request, slug):
    """Create or delete a like for the authenticated user on an event by slug."""
    event = get_object_or_404(Event, slug=slug)

    if request.method == "POST":
        like, created = Like.objects.get_or_create(user=request.user, event=event)
        if created:
            return Response({"liked": True}, status=status.HTTP_201_CREATED)
        return Response({"liked": True}, status=status.HTTP_200_OK)

    # DELETE
    Like.objects.filter(user=request.user, event=event).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def scan_qr_code(request):
    """
    Scan a QR code and confirm participation in an event.
    This endpoint is used by the mobile app QR scanner.
    """
    serializer = QRCodeScanSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    qr_code = serializer.validated_data['code']

    # Check if user already has participation for this event
    existing_participation = EventParticipation.objects.filter(
        user=request.user,
        event=qr_code.event
    ).first()

    if existing_participation:
        return Response({
            'error': 'You have already confirmed participation for this event.',
            'participation': {
                'id': str(existing_participation.id),
                'event_title': existing_participation.event.title,
                'confirmed_at': existing_participation.confirmed_at,
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create participation confirmation
    participation = EventParticipation.objects.create(
        user=request.user,
        event=qr_code.event,
        qr_code=qr_code,
        participation_type=EventParticipation.ParticipationType.QR_SCAN
    )

    # Update QR code usage statistics
    qr_code.usage_count += 1
    qr_code.last_used_at = timezone.now()
    qr_code.save(update_fields=['usage_count', 'last_used_at'])

    # Return success response
    return Response({
        'success': True,
        'message': 'Participation confirmed successfully!',
        'participation': {
            'id': str(participation.id),
            'event_title': qr_code.event.title,
            'confirmed_at': participation.confirmed_at,
        },
        'event': {
            'title': qr_code.event.title,
            'slug': qr_code.event.slug,
            'starts_at': qr_code.event.starts_at,
            'ends_at': qr_code.event.ends_at,
        }
    }, status=status.HTTP_201_CREATED)


class EventMapViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing event maps.
    Only authenticated organizations can create/update/delete maps for their own events.
    """
    queryset = EventMap.objects.all()
    serializer_class = EventMapSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        """Filter maps based on authentication and permissions."""
        queryset = EventMap.objects.select_related('event').prefetch_related('locations')

        # For public access, only show active maps for verified events
        if not self.request.user.is_authenticated:
            return queryset.filter(is_active=True, event__verified=True)

        # For authenticated users, show all maps they have access to
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(self.request)
            if current_org:
                # Show maps for events owned by the organization
                return queryset.filter(event__organization=current_org)
        except Exception:
            pass

        # Fallback to public access
        return queryset.filter(is_active=True, event__verified=True)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return EventMapCreateSerializer
        return EventMapSerializer

    def perform_create(self, serializer):
        """Create event map with organization authentication."""
        from .authentication import get_current_organization
        organization = get_current_organization(self.request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # The serializer handles the actual creation
        return serializer.save()

    @action(detail=True, methods=['post'], url_path='add-location')
    def add_location(self, request, pk=None):
        """Add a location to an existing event map."""
        event_map = self.get_object()

        # Check if organization owns the event
        from .authentication import get_current_organization
        organization = get_current_organization(request)
        if not organization or str(event_map.event.organization_id) != str(organization.id):
            return Response(
                {'error': _('You do not have permission to modify this event map.')},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = EventMapLocationCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            # Override the event_slug validation since we already have the event_map
            validated_data = serializer.validated_data.copy()
            validated_data['event_slug'] = event_map.event.slug

            location = EventMapLocation.objects.create(
                event_map=event_map,
                name=validated_data['name'],
                description=validated_data.get('description') or None,
                latitude=validated_data['latitude'],
                longitude=validated_data['longitude'],
                address=validated_data.get('address') or None,
                order_index=validated_data.get('order_index', 0),
                is_active=True
            )

            return Response(
                EventMapLocationSerializer(location).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='locations')
    def get_locations(self, request, pk=None):
        """Get all locations for an event map."""
        event_map = self.get_object()
        locations = event_map.locations.filter(is_active=True).order_by('order_index')
        serializer = EventMapLocationSerializer(locations, many=True)
        return Response(serializer.data)


class EventMapLocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual event map locations.
    """
    queryset = EventMapLocation.objects.all()
    serializer_class = EventMapLocationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        """Filter locations based on authentication and permissions."""
        queryset = EventMapLocation.objects.select_related('event_map__event')

        # For public access, only show active locations for verified events
        if not self.request.user.is_authenticated:
            return queryset.filter(is_active=True, event_map__is_active=True, event_map__event__verified=True)

        # For authenticated users, show locations they have access to
        try:
            from .authentication import get_current_organization
            current_org = get_current_organization(self.request)
            if current_org:
                # Show locations for events owned by the organization
                return queryset.filter(event_map__event__organization=current_org)
        except Exception:
            pass

        # Fallback to public access
        return queryset.filter(is_active=True, event_map__is_active=True, event_map__event__verified=True)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return EventMapLocationCreateSerializer
        return EventMapLocationSerializer

    def perform_create(self, serializer):
        """Create event map location with organization authentication."""
        from .authentication import get_current_organization
        organization = get_current_organization(self.request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # The serializer handles the actual creation
        return serializer.save()

    def perform_update(self, serializer):
        """Update event map location with organization authentication."""
        from .authentication import get_current_organization
        organization = get_current_organization(self.request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # Check if organization owns the event
        if str(serializer.instance.event_map.event.organization_id) != str(organization.id):
            raise serializers.ValidationError(_('You do not have permission to modify this event map location.'))

        return serializer.save()

    def perform_destroy(self, instance):
        """Delete event map location with organization authentication."""
        from .authentication import get_current_organization
        organization = get_current_organization(self.request)
        if not organization:
            raise serializers.ValidationError(_('No authenticated organization found.'))

        # Check if organization owns the event
        if str(instance.event_map.event.organization_id) != str(organization.id):
            raise serializers.ValidationError(_('You do not have permission to delete this event map location.'))

        instance.delete()