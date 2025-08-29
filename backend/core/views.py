from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, Category, Organization, Tag, Like
from .serializers import (
    EventSerializer,
    CategorySerializer,
    OrganizationSerializer,
    OrganizationAuthSerializer,
    TagSerializer,
    EventCreateSerializer
)
from .authentication import (
    authenticate_organization,
    get_current_organization,
    clear_organization_session,
    OrganizationAuthenticationMixin
)
from .tasks import send_discord_notification
from django.conf import settings
from .cache import cache_categories, cache_public_events
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated


class CategoryViewSet(viewsets.GenericViewSet):
    """
    ViewSet for listing categories only (no single category retrieval)
    Uses Redis caching for performance with translation support
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def list(self, request, *args, **kwargs):
        """List all categories with caching and language support."""
        # Get all categories ordered by order_index and name
        queryset = self.get_queryset()

        # Extract filter parameters for cache key generation
        filters = {}
        if hasattr(request, 'query_params'):
            # Include language parameter in cache key
            if 'lang' in request.query_params:
                filters['lang'] = request.query_params['lang']

        # Cache the categories list
        data = cache_categories(
            queryset=queryset,
            serializer_class=self.get_serializer_class(),
            context={'request': request},
            **filters
        )

        return Response(data)


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
            'message': 'Successfully logged out'
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
                {'error': 'No organization authenticated'},
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
                {'error': 'No organization authenticated'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        organization = self.get_object()

        # Verify the authenticated org matches the requested org
        if str(organization.id) != str(current_org.id):
            return Response(
                {'error': 'Access denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['image']

        # Validate image size (5MB limit)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image size cannot exceed 5MB'},
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
        return EventSerializer



    def get_queryset(self):
        """Optimized version with better database performance"""
        now = timezone.now()
        today = now.date()
        twenty_four_hours_ago = now - timezone.timedelta(hours=24)

        # Use raw SQL for better performance on large datasets
        queryset = Event.objects.select_related('category', 'organization').prefetch_related('tags')

        current_org = self.get_current_organization()
        if current_org:
            queryset = queryset.filter(organization__id=current_org.id)
        else:
            # Apply filters first, then annotations
            queryset = queryset.filter(verified=True, ends_at__gte=now)

        # Simpler ordering - avoid complex CASE statements
        return queryset.extra(
            select={
                'is_today': "DATE(starts_at) = %s",
                'is_new': "verified_at >= %s"
            },
            select_params=[today, twenty_four_hours_ago],
            order_by=['-is_today', '-is_new', 'starts_at']
        )

    def list(self, request, *args, **kwargs):
        """
        List events with caching for public (non-authenticated) requests.
        Skip caching if user is authenticated to ensure 'liked' field is accurate.
        """
        current_org = self.get_current_organization()
        is_user_authenticated = request.user and request.user.is_authenticated

        # Only cache public events (when no org is authenticated AND no user is authenticated)
        if not current_org and not is_user_authenticated:
            queryset = self.filter_queryset(self.get_queryset())

            # Extract filter parameters for cache key generation
            filters = {}
            if hasattr(request, 'query_params'):
                # Include relevant filter parameters in cache key
                for param in ['category__slug', 'organization__slug', 'verified', 'search', 'ordering', 'lang']:
                    if param in request.query_params:
                        filters[param] = request.query_params[param]

            # Cache the public events list
            data = cache_public_events(
                queryset=queryset,
                serializer_class=self.get_serializer_class(),
                context={'request': request},
                **filters
            )

            return Response(data)

        # For authenticated users or organizations, don't cache (personalized data)
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
