from django.shortcuts import render, get_object_or_404
from django.db.models import Case, When, BooleanField, Value
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, Category, Organization, Tag, OrganizationCode
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


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing categories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [AllowAny]
    authentication_classes = []


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category__slug', 'organization__slug', 'verified']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['starts_at']
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    authentication_classes = []
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'create':
            return EventCreateSerializer
        return EventSerializer



    def get_queryset(self):
        """
        Custom ordering for events:
        1. Events starting today
        2. New events (verified in the last 24 hours)
        3. All other events, sorted by start date
        If an organization is authenticated, return all their events with this custom sorting.
        If not, return only upcoming and verified events.
        """
        now = timezone.now()
        today = now.date()
        twenty_four_hours_ago = now - timezone.timedelta(hours=24)

        queryset = Event.objects.select_related('category', 'organization').prefetch_related('tags')

        # Annotate with sorting conditions
        queryset = queryset.annotate(
            is_today=Case(
                When(starts_at__date=today, then=Value(True)),
                default=Value(False),
                output_field=BooleanField()
            ),
            is_new=Case(
                When(verified_at__gte=twenty_four_hours_ago, then=Value(True)),
                default=Value(False),
                output_field=BooleanField()
            )
        )

        # Apply custom ordering
        queryset = queryset.order_by('-is_today', '-is_new', 'starts_at')

        current_org = self.get_current_organization()
        if current_org:
            queryset = queryset.filter(organization__id=current_org.id)
        else:
            queryset = queryset.filter(verified=True, ends_at__gte=now)

        return queryset

    def create(self, request, *args, **kwargs):
        """
        Create a new event (requires authenticated organization)
        ORGANIZATION AUTH REQUIRED
        """
        # Check if organization is authenticated using our session-based auth
        organization = self.check_organization_authentication()

        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            event = serializer.save()

            # Send Discord notification asynchronously
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
