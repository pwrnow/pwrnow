from django.utils import timezone
from django.db import models, IntegrityError
from django.http import JsonResponse
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Event,
    Category,
    Organization,
    Tag,
    Like,
    Post,
    ScheduleItem,
    EventParticipation,
    EventMap,
    EventMapLocation,
    Friendship,
    EventCoHost,
)
from .serializers import (
    EventSerializer,
    EventDetailSerializer,
    CategorySerializer,
    OrganizationSerializer,
    OrganizationAuthSerializer,
    OrganizationUpdateSerializer,
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
    OrganizationAuthenticationMixin,
)
from .permissions import IsStaff
from .tasks import send_discord_notification
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.permissions import IsAuthenticated
from django.utils.translation import gettext as _
from utils.logging_mixins import ApiLoggingMixin, log_api_call

import logging

logger = logging.getLogger(__name__)


class CategoryViewSet(ApiLoggingMixin, viewsets.GenericViewSet):
    """
    ViewSet for listing categories only (no single category retrieval)
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def list(self, request, *args, **kwargs):
        """List all categories ordered by order_index and name."""
        logger.debug("Fetching all categories")
        queryset = self.get_queryset()
        serializer = self.get_serializer(
            queryset, many=True, context={"request": request}
        )
        logger.info(f"Listed {len(serializer.data)} categories")
        return Response(serializer.data)


class OrganizationViewSet(ApiLoggingMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing organizations
    """

    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    lookup_field = "slug"
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    authentication_classes = []

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        authentication_classes=[],
        parser_classes=[JSONParser],
    )
    def authenticate(self, request):
        """
        Authenticate organization using a code and store in session
        PUBLIC ENDPOINT - No authentication required
        """
        logger.debug("Organization authentication attempt")
        serializer = OrganizationAuthSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning(
                f"Organization authentication validation failed: {serializer.errors}"
            )
            return Response(
                {"error": "Invalid request data", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use the new session-based authentication
        organization = authenticate_organization(
            request, serializer.validated_data["code"]
        )

        if not organization:
            logger.warning("Organization authentication failed: Invalid code")
            return Response(
                {"error": "Authentication failed"}, status=status.HTTP_401_UNAUTHORIZED
            )

        # Return organization data
        logger.info(
            f"Organization authenticated successfully: org_id={organization.id} name={organization.name}"
        )
        org_serializer = self.get_serializer(organization, context={"request": request})
        return Response(
            {
                "organization": org_serializer.data,
                "message": "Successfully authenticated",
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        parser_classes=[JSONParser],
    )
    def logout(self, request):
        """
        Clear organization authentication from session
        PUBLIC ENDPOINT - No authentication required
        """
        logger.debug("Organization logout initiated")
        clear_organization_session(request)
        logger.info("Organization logged out successfully")
        return Response(
            {"message": _("Successfully logged out")}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def current(self, request):
        """
        Get current authenticated organization
        PUBLIC ENDPOINT - Returns organization if session exists, 401 if not
        """
        logger.debug("Fetching current authenticated organization")
        organization = get_current_organization(request)
        if not organization:
            logger.debug("No organization authenticated in session")
            return Response(
                {"error": _("No organization authenticated")},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        logger.debug(f"Current organization retrieved: org_id={organization.id}")
        serializer = self.get_serializer(organization, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def image(self, request, slug=None):
        """
        Upload organization image
        REQUIRES ORGANIZATION AUTHENTICATION
        """
        logger.debug(f"Organization image upload attempt: slug={slug}")
        # Check if user is authenticated for this organization
        current_org = get_current_organization(request)
        if not current_org:
            logger.warning(
                f"Organization image upload failed: No organization authenticated"
            )
            return Response(
                {"error": _("No organization authenticated")},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        organization = self.get_object()

        # Verify the authenticated org matches the requested org
        if str(organization.id) != str(current_org.id):
            logger.warning(
                f"Organization image upload denied: org_id={organization.id} != current_org_id={current_org.id}"
            )
            return Response(
                {"error": _("Access denied")}, status=status.HTTP_403_FORBIDDEN
            )

        if "image" not in request.FILES:
            logger.warning(
                f"Organization image upload failed: No image file provided for org_id={organization.id}"
            )
            return Response(
                {"error": _("No image file provided")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_file = request.FILES["image"]

        # Validate image size (5MB limit)
        if image_file.size > 5 * 1024 * 1024:
            logger.warning(
                f"Organization image upload failed: File too large ({image_file.size} bytes) for org_id={organization.id}"
            )
            return Response(
                {"error": _("Image size cannot exceed 5MB")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update organization image
        organization.image = image_file
        organization.save()

        logger.info(
            f"Organization image uploaded successfully: org_id={organization.id} file_size={image_file.size}"
        )
        # Return updated organization data
        serializer = self.get_serializer(organization, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"], parser_classes=[JSONParser])
    def update_details(self, request, slug=None):
        """
        Update organization details (short_name)
        REQUIRES ORGANIZATION AUTHENTICATION
        """
        logger.debug(f"Organization details update attempt: slug={slug}")
        # Check if user is authenticated for this organization
        current_org = get_current_organization(request)
        if not current_org:
            logger.warning(
                f"Organization details update failed: No organization authenticated"
            )
            return Response(
                {"error": _("No organization authenticated")},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        organization = self.get_object()

        # Verify the authenticated org matches the requested org
        if str(organization.id) != str(current_org.id):
            logger.warning(
                f"Organization details update denied: org_id={organization.id} != current_org_id={current_org.id}"
            )
            return Response(
                {"error": _("Access denied")}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = OrganizationUpdateSerializer(
            organization, data=request.data, partial=True
        )
        if not serializer.is_valid():
            logger.warning(
                f"Organization details update validation failed: org_id={organization.id} errors={serializer.errors}"
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        logger.info(
            f"Organization details updated successfully: org_id={organization.id}"
        )

        # Return updated organization data using the main serializer
        response_serializer = self.get_serializer(
            organization, context={"request": request}
        )
        return Response(response_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def search(self, request):
        """
        Search organizations by name for co-host selection.
        PUBLIC ENDPOINT - No authentication required
        Query parameter: ?q=search_term
        If query is empty or short, returns first 20 organizations ordered by name.
        """
        query = request.query_params.get("q", "").strip()
        logger.debug(f"Organization search: query='{query}'")

        # Get current organization to exclude from results (can't co-host own event)
        current_org = get_current_organization(request)

        if len(query) < 2:
            # Return initial list of organizations ordered by name
            queryset = Organization.objects.all().order_by("name")
        else:
            # Search by name
            queryset = Organization.objects.filter(name__icontains=query)

        if current_org:
            queryset = queryset.exclude(id=current_org.id)

        queryset = queryset[:20]  # Limit to 20 results

        serializer = self.get_serializer(
            queryset, many=True, context={"request": request}
        )
        logger.info(f"Organization search returned {len(serializer.data)} results")
        return Response(serializer.data, status=status.HTTP_200_OK)


class TagViewSet(ApiLoggingMixin, viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing tags
    """

    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = "slug"
    permission_classes = [AllowAny]
    authentication_classes = []


class EventViewSet(
    ApiLoggingMixin, OrganizationAuthenticationMixin, viewsets.ModelViewSet
):
    """
    ViewSet for listing and creating events with filtering and search capabilities
    PUBLIC READ ACCESS - Anyone can view events
    ORGANIZATION AUTH REQUIRED - For creating events
    Only create, list, and retrieve are allowed.
    """

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["category__slug"]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "create":
            return EventCreateSerializer
        if self.action == "retrieve":
            return EventDetailSerializer
        return EventSerializer

    def get_queryset(self):
        """Optimized version with better database performance"""
        from django.db.models import Q, Value, BooleanField, Case, When, Prefetch
        from django.db.models.functions import Cast, TruncDate

        now = timezone.now()
        today = now.date()

        # Always select_related for required ForeignKeys (category, organization)
        queryset = Event.objects.select_related(
            "category", "organization"
        ).prefetch_related(
            "tags",
            Prefetch(
                "co_hosts", queryset=EventCoHost.objects.select_related("organization")
            ),
        )

        # For retrieve action, prefetch posts and schedule to avoid N+1 queries
        if self.action == "retrieve":
            # Use Prefetch for optional relationships instead of select_related to avoid unnecessary JOINs
            queryset = queryset.prefetch_related(
                Prefetch("schedule"),
                Prefetch("schedule__items"),
                "posts__organization",
                "posts__images",
            )
        # For list action, prefetch posts, schedule, and event_map to avoid N+1 queries
        elif self.action == "list":
            # Use Prefetch for optional 1-to-1 relationships to avoid LEFT JOINs when not needed
            queryset = queryset.prefetch_related(
                Prefetch("schedule"),
                Prefetch("schedule__items"),
                Prefetch("event_map"),
                Prefetch("event_map__locations"),
                "posts__organization",
                "posts__images",
            )

        current_org = self.get_current_organization()
        if current_org:
            # Include events where org is the admin OR a co-host
            queryset = queryset.filter(
                Q(organization__id=current_org.id)
                | Q(co_hosts__organization__id=current_org.id)
            ).distinct()
        else:
            # Check if user is staff using the permission class logic
            is_staff_user = self._is_staff_user()

            # Staff users see all events (visible and hidden)
            # Regular users only see visible events
            if not is_staff_user:
                queryset = queryset.filter(
                    visible=True, ends_at__gte=now, publication_date__lte=today
                )
            else:
                # Staff users see all events, but still filter by end date
                queryset = queryset.filter(ends_at__gte=now)

        # Add useful annotations for authenticated users (participation and liked)
        request = self.request
        if request and hasattr(request, "user") and request.user.is_authenticated:
            from django.db.models import Exists, OuterRef, Count

            queryset = queryset.annotate(
                user_participation_exists=Exists(
                    EventParticipation.objects.filter(
                        user=request.user, event=OuterRef("pk")
                    )
                ),
                user_liked_exists=Exists(
                    Like.objects.filter(user=request.user, event=OuterRef("pk"))
                ),
            )
            # Only staff users need likes count; annotate when staff to avoid unnecessary work
            if getattr(request.user, "is_staff", False):
                queryset = queryset.annotate(likes_total=Count("likes"))

        # Use modern Django ORM instead of deprecated .extra()
        # Annotate is_today and is_new for ordering
        queryset = queryset.annotate(
            is_today=Case(
                When(Q(starts_at__date=today), then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
            is_new=Case(
                When(publication_date=today, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
        ).order_by("-is_today", "-is_new", "starts_at")

        return queryset

    def _is_staff_user(self):
        """
        Helper method to check if the current user is staff.
        Uses the same logic as the IsStaff permission class.
        """
        permission = IsStaff()
        return permission.has_permission(self.request, self)

    def list(self, request, *args, **kwargs):
        """List events with filtering support."""
        queryset = self.filter_queryset(self.get_queryset())

        # Optimize friendship queries for authenticated users by batching once
        friend_ids = None
        if request and hasattr(request, "user") and request.user.is_authenticated:
            friendships = Friendship.objects.filter(
                models.Q(user1=request.user) | models.Q(user2=request.user)
            ).values_list("user1_id", "user2_id")

            friend_ids = set()
            for user1_id, user2_id in friendships:
                friend_ids.add(user1_id)
                friend_ids.add(user2_id)
            friend_ids.discard(request.user.id)

        # Paginate first to avoid computing mappings for the entire dataset
        page = self.paginate_queryset(queryset)
        events = page if page is not None else list(queryset)

        friends_interested_map = {}
        if friend_ids:
            event_ids = [e.id for e in events]
            if event_ids:
                # Initialize map with empty lists for all events to prevent fallback queries
                for event_id in event_ids:
                    friends_interested_map[event_id] = []

                interested_likes = Like.objects.filter(
                    event_id__in=event_ids, user_id__in=friend_ids
                ).select_related("user")

                for like in interested_likes:
                    ev_id = like.event_id
                    friend = like.user
                    profile_image_url = None
                    if friend.profile_image:
                        profile_image_url = request.build_absolute_uri(
                            friend.profile_image.url
                        )

                    friends_interested_map[ev_id].append(
                        {
                            "id": str(friend.id),
                            "username": friend.username,
                            "profile_image_url": profile_image_url,
                        }
                    )

        context = {
            "request": request,
            "friend_ids": friend_ids,
            "friends_interested_map": friends_interested_map,
        }

        if page is not None:
            serializer = self.get_serializer(page, many=True, context=context)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(events, many=True, context=context)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create a new event (requires authenticated organization)
        ORGANIZATION AUTH REQUIRED
        """
        logger.debug("Event creation initiated")
        # Check if organization is authenticated using our session-based auth
        self.check_organization_authentication()

        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            event = serializer.save()
            logger.info(
                f"Event created successfully: event_id={event.id} title={event.title} org_id={event.organization_id}"
            )

            # Send Discord notification unless suppressed via settings
            if not (
                getattr(settings, "SUPPRESS_NOTIFICATIONS", False)
                or getattr(settings, "SUPPRESS_DISCORD_NOTIFICATIONS", False)
            ):
                logger.debug(f"Sending Discord notification for event_id={event.id}")
                send_discord_notification.delay(str(event.id))

            # Return the created event using the read serializer
            read_serializer = EventSerializer(event, context={"request": request})
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)

        logger.warning(f"Event creation validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": 'Method "PUT" not allowed.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {"detail": 'Method "PATCH" not allowed.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def destroy(self, request, *args, **kwargs):
        logger.debug("Event deletion initiated")
        organization = self.get_current_organization()
        if not organization:
            logger.warning("Event deletion failed: No organization authenticated")
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        event = self.get_object()
        # Only the admin organization can delete the event (not co-hosts)
        if not event.organization or event.organization.id != organization.id:
            logger.warning(
                f"Event deletion denied: event_id={event.id} org_id={event.organization_id} != current_org_id={organization.id}"
            )
            return Response(
                {
                    "detail": _(
                        "Only the admin organization can delete this event. Co-hosts cannot delete events."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        logger.info(
            f"Event deleted: event_id={event.id} title={event.title} org_id={organization.id}"
        )
        self.perform_destroy(event)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True, methods=["get"], url_path="posts", permission_classes=[AllowAny]
    )
    def list_posts(self, request, slug=None):
        """
        List posts for a given event by slug.
        Public: returns only visible posts.
        If an organization is authenticated and owns the event, include hidden as well.
        """
        logger.debug(f"Fetching posts for event: slug={slug}")
        event = self.get_object()
        current_org = self.get_current_organization()

        queryset = (
            event.posts.select_related("organization")
            .prefetch_related("images")
            .order_by("-created_at")
        )
        if not (current_org and str(current_org.id) == str(event.organization_id)):
            queryset = queryset.filter(visible=True)

        page = self.paginate_queryset(queryset)
        posts_count = len(page) if page else queryset.count()
        logger.info(f"Listed {posts_count} posts for event_id={event.id}")
        serializer = PostSerializer(
            page or queryset, many=True, context={"request": request}
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(
        detail=True, methods=["get"], url_path="schedule", permission_classes=[AllowAny]
    )
    def get_schedule(self, request, slug=None):
        """
        Return the schedule for this event.
        - Public: only if event is visible
        - Owner org: return schedule regardless of visibility
        """
        logger.debug(f"Fetching schedule for event: slug={slug}")
        event = self.get_object()
        current_org = self.get_current_organization()

        if (
            not (current_org and str(current_org.id) == str(event.organization_id))
            and not event.visible
        ):
            logger.warning(
                f"Schedule access denied for hidden event: event_id={event.id}"
            )
            return Response(
                {"detail": _("Event not visible.")}, status=status.HTTP_404_NOT_FOUND
            )

        schedule = getattr(event, "schedule", None)
        if not schedule:
            logger.debug(f"No schedule found for event_id={event.id}")
            return Response(None, status=status.HTTP_200_OK)

        logger.info(
            f"Schedule retrieved for event_id={event.id} schedule_id={schedule.id}"
        )
        serializer = ScheduleSerializer(schedule, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(
        detail=True, methods=["post"], url_path="verify", permission_classes=[IsStaff]
    )
    def verify_event(self, request, slug=None):
        """
        Verify an event (staff only).
        POST /events/{slug}/verify/
        """
        logger.debug(
            f"Event visibility change attempt: slug={slug} by user_id={request.user.id}"
        )
        event = self.get_object()

        if event.visible:
            logger.warning(
                f"Event visibility change failed: Event already visible event_id={event.id}"
            )
            return Response(
                {"detail": _("Event is already visible.")},
                status=status.HTTP_400_BAD_REQUEST,
            )

        event.visible = True
        event.visible_at = timezone.now()
        event.visible_by = request.user
        event.save()

        logger.info(
            f"Event made visible successfully: event_id={event.id} title={event.title} by user_id={request.user.id}"
        )
        # Return updated event data
        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PostViewSet(
    ApiLoggingMixin, OrganizationAuthenticationMixin, viewsets.GenericViewSet
):
    """
    Web-only endpoints for creating and deleting posts.
    Requires organization authentication.
    """

    queryset = (
        Post.objects.all()
        .select_related("event", "organization")
        .prefetch_related("images")
    )
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return PostCreateSerializer
        return PostSerializer

    def create(self, request, *args, **kwargs):
        logger.debug("Post creation initiated")
        self.check_organization_authentication()
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        post = serializer.save()
        logger.info(
            f"Post created successfully: post_id={post.id} event_id={post.event_id} org_id={post.organization_id}"
        )
        read_serializer = PostSerializer(post, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        logger.debug("Post deletion initiated")
        organization = self.get_current_organization()
        if not organization:
            logger.warning("Post deletion failed: No organization authenticated")
            return Response(
                {"detail": _("Authentication required.")},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        post = self.get_object()
        if not post.organization or str(post.organization_id) != str(organization.id):
            logger.warning(
                f"Post deletion denied: post_id={post.id} org_id={post.organization_id} != current_org_id={organization.id}"
            )
            return Response(
                {"detail": _("You do not have permission to delete this post.")},
                status=status.HTTP_403_FORBIDDEN,
            )
        logger.info(
            f"Post deleted: post_id={post.id} event_id={post.event_id} org_id={organization.id}"
        )
        post.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ScheduleItemViewSet(
    ApiLoggingMixin, OrganizationAuthenticationMixin, viewsets.GenericViewSet
):
    """
    Endpoints for creating and deleting schedule items.
    Requires organization authentication and ownership of the event/schedule.
    """

    queryset = ScheduleItem.objects.select_related("schedule__event")
    parser_classes = [JSONParser]
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "create":
            return ScheduleItemCreateSerializer
        return ScheduleItemSerializer

    def create(self, request, *args, **kwargs):
        logger.debug("Schedule item creation initiated")
        self.check_organization_authentication()
        serializer = self.get_serializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        item = serializer.save()
        logger.info(
            f"Schedule item created: item_id={item.id} schedule_id={item.schedule_id} title={item.title}"
        )
        read = ScheduleItemSerializer(item, context={"request": request})
        return Response(read.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        logger.debug("Schedule item deletion initiated")
        organization = self.get_current_organization()
        if not organization:
            logger.warning(
                "Schedule item deletion failed: No organization authenticated"
            )
            return Response(
                {"detail": _("Authentication required.")},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        item = self.get_object()
        event_org_id = str(item.schedule.event.organization_id)
        if event_org_id != str(organization.id):
            logger.warning(
                f"Schedule item deletion denied: item_id={item.id} event_org_id={event_org_id} != current_org_id={organization.id}"
            )
            return Response(
                {
                    "detail": _(
                        "You do not have permission to delete this schedule item."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        logger.info(
            f"Schedule item deleted: item_id={item.id} schedule_id={item.schedule_id} org_id={organization.id}"
        )
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
@log_api_call("core.event_like")
def event_like(request, slug):
    """Create or delete a like for the authenticated user on an event by slug."""
    # Scoped throttle name for this endpoint
    event_like.throttle_scope = "event_like"
    event = get_object_or_404(Event, slug=slug)

    if request.method == "POST":
        logger.debug(
            f"Like creation attempt: user_id={request.user.id} event_id={event.id}"
        )
        like, created = Like.objects.get_or_create(user=request.user, event=event)
        if created:
            logger.info(f"Like created: user_id={request.user.id} event_id={event.id}")
            return Response({"liked": True}, status=status.HTTP_201_CREATED)
        logger.debug(
            f"Like already exists: user_id={request.user.id} event_id={event.id}"
        )
        return Response({"liked": True}, status=status.HTTP_200_OK)

    # DELETE
    logger.debug(
        f"Like deletion attempt: user_id={request.user.id} event_id={event.id}"
    )
    deleted_count = Like.objects.filter(user=request.user, event=event).delete()[0]
    if deleted_count > 0:
        logger.info(f"Like deleted: user_id={request.user.id} event_id={event.id}")
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
@log_api_call("core.scan_qr_code")
def scan_qr_code(request):
    """
    Scan a QR code and confirm participation in an event.
    This endpoint is used by the mobile app QR scanner.
    """
    scan_qr_code.throttle_scope = "qr_scan"

    logger.debug(f"QR code scan attempt: user_id={request.user.id}")
    serializer = QRCodeScanSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(
            f"QR code scan validation failed: user_id={request.user.id} errors={serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    qr_code = serializer.validated_data["code"]

    # Check if user already has participation for this event
    existing_participation = EventParticipation.objects.filter(
        user=request.user, event=qr_code.event
    ).first()

    if existing_participation:
        logger.warning(
            f"QR code scan failed: Duplicate participation user_id={request.user.id} event_id={qr_code.event.id}"
        )
        return Response(
            {
                "error": "You have already confirmed participation for this event.",
                "participation": {
                    "id": str(existing_participation.id),
                    "event_title": existing_participation.event.title,
                    "confirmed_at": existing_participation.confirmed_at,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Create participation confirmation
    participation = EventParticipation.objects.create(
        user=request.user,
        event=qr_code.event,
        qr_code=qr_code,
        participation_type=EventParticipation.ParticipationType.QR_SCAN,
    )

    # Update QR code usage statistics
    qr_code.usage_count += 1
    qr_code.last_used_at = timezone.now()
    qr_code.save(update_fields=["usage_count", "last_used_at"])

    logger.info(
        f"QR code scan successful: user_id={request.user.id} event_id={qr_code.event.id} qr_code_id={qr_code.id} participation_id={participation.id}"
    )
    # Return success response
    return Response(
        {
            "success": True,
            "message": "Participation confirmed successfully!",
            "participation": {
                "id": str(participation.id),
                "event_title": qr_code.event.title,
                "confirmed_at": participation.confirmed_at,
            },
            "event": {
                "title": qr_code.event.title,
                "slug": qr_code.event.slug,
                "starts_at": qr_code.event.starts_at,
                "ends_at": qr_code.event.ends_at,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
@log_api_call("core.search_users")
def search_users(request):
    """
    search_users.throttle_scope = 'user_search'
    Search for users by username (minimum 3 characters).
    Returns users with friendship status.
    """
    from django.contrib.auth import get_user_model
    from .models import Friendship, FriendRequest
    from .serializers import UserSearchSerializer

    User = get_user_model()
    query = request.query_params.get("q", "").strip()

    logger.debug(
        f"User search initiated: user_id={request.user.id} query_length={len(query)}"
    )
    if len(query) < 3:
        logger.warning(f"User search failed: Query too short user_id={request.user.id}")
        return Response(
            {"error": _("Search query must be at least 3 characters long.")},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Search for users by username (case-insensitive)
    users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)[
        :20
    ]

    # Get current user's friendships
    friendships = Friendship.objects.filter(
        models.Q(user1=request.user) | models.Q(user2=request.user)
    ).values_list("user1_id", "user2_id")

    friend_ids = set()
    for user1_id, user2_id in friendships:
        friend_ids.add(user1_id)
        friend_ids.add(user2_id)
    friend_ids.discard(request.user.id)

    # Get pending friend requests (both sent and received)
    sent_requests = FriendRequest.objects.filter(
        from_user=request.user, status=FriendRequest.Status.PENDING
    ).values_list("to_user_id", flat=True)

    received_requests = FriendRequest.objects.filter(
        to_user=request.user, status=FriendRequest.Status.PENDING
    ).values_list("from_user_id", flat=True)

    sent_request_ids = set(sent_requests)
    received_request_ids = set(received_requests)

    # Annotate users with detailed friendship status
    results = []
    for user in users:
        user_id = user.id
        profile_image_url = None
        if user.profile_image:
            profile_image_url = request.build_absolute_uri(user.profile_image.url)

        user_data = {
            "id": user_id,
            "username": user.username,
            "profile_image_url": profile_image_url,
            "is_friend": user_id in friend_ids,
            "has_pending_request": user_id in sent_request_ids
            or user_id in received_request_ids,
            "friendship_status": (
                "friend"
                if user_id in friend_ids
                else (
                    "request_sent"
                    if user_id in sent_request_ids
                    else (
                        "request_received"
                        if user_id in received_request_ids
                        else "none"
                    )
                )
            ),
        }
        results.append(user_data)

    logger.info(
        f"User search completed: user_id={request.user.id} results_count={len(results)}"
    )
    serializer = UserSearchSerializer(results, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friends_attending_event(request, slug):
    """
    Get list of user's friends who are attending (have liked) a specific event.
    """
    # Decorator-like logging: this endpoint is lightweight; add minimal manual start/end
    start_user_id = getattr(getattr(request, "user", None), "id", None)
    logger.debug(f"FRIENDS_ATTENDING: user_id={start_user_id} event_slug={slug}")
    from django.contrib.auth import get_user_model
    from .models import Friendship, Like, Event
    from .serializers import UserSearchSerializer

    User = get_user_model()

    # Get the event
    try:
        event = Event.objects.get(slug=slug)
    except Event.DoesNotExist:
        logger.warning(f"Friends attending lookup failed: Event not found slug={slug}")
        return Response(
            {"error": _("Event not found.")}, status=status.HTTP_404_NOT_FOUND
        )

    # Get current user's friendships
    friendships = Friendship.objects.filter(
        models.Q(user1=request.user) | models.Q(user2=request.user)
    ).values_list("user1_id", "user2_id")

    friend_ids = set()
    for user1_id, user2_id in friendships:
        friend_ids.add(user1_id)
        friend_ids.add(user2_id)
    friend_ids.discard(request.user.id)

    # Get friends who have liked this event
    attending_friends = (
        Like.objects.filter(event=event, user_id__in=friend_ids)
        .select_related("user")
        .values("user__id", "user__username")
    )

    # Format the response
    friends_list = [
        {"id": str(friend["user__id"]), "username": friend["user__username"]}
        for friend in attending_friends
    ]

    logger.info(
        f"Friends attending event retrieved: user_id={start_user_id} event_id={event.id} friends_count={len(friends_list)}"
    )
    return Response({"count": len(friends_list), "friends": friends_list})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def send_friend_request(request):
    """Send a friend request to another user."""
    send_friend_request.throttle_scope = "friend_action"
    import logging
    from .serializers import FriendRequestCreateSerializer, FriendRequestSerializer
    from notifications.services import push_service

    logger = logging.getLogger(__name__)

    logger.debug(f"FRIENDS_REQUEST_SEND: user_id={request.user.id} initiating")

    serializer = FriendRequestCreateSerializer(
        data=request.data, context={"request": request}
    )

    if serializer.is_valid():
        try:
            friend_request = serializer.save()
            logger.info(
                f"FRIENDS_REQUEST_SEND_SUCCESS: request_id={friend_request.id} from user_id={request.user.id} to user_id={friend_request.to_user.id}"
            )

            # Send notification
            try:
                notification_result = push_service.send_friend_request_notification(
                    friend_request
                )
                logger.debug(
                    f"FRIENDS_REQUEST_NOTIFICATION: request_id={friend_request.id} result={notification_result}"
                )
            except Exception as e:
                logger.error(
                    f"FRIENDS_REQUEST_NOTIFICATION_ERROR: Failed to send notification for friend request {friend_request.id}: {str(e)}"
                )

            response_serializer = FriendRequestSerializer(friend_request)
            logger.debug(
                f"FRIENDS_REQUEST_SEND_COMPLETE: request_id={friend_request.id}"
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            if "duplicate key value violates unique constraint" in str(e):
                logger.warning(
                    f"FRIENDS_REQUEST_SEND_DUPLICATE: user_id={request.user.id} error={str(e)}"
                )
                return Response(
                    {"error": "You have already sent a friend request to this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            else:
                return Response(
                    {"error": "Failed to create friend request"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            logger.error(
                f"FRIENDS_REQUEST_SEND_ERROR: user_id={request.user.id} error={str(e)}"
            )
            return Response(
                {"error": "Failed to create friend request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    else:
        logger.warning(
            f"FRIENDS_REQUEST_SEND_VALIDATION_ERROR: user_id={request.user.id} errors={serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def accept_friend_request(request, request_id):
    """Accept a friend request."""
    accept_friend_request.throttle_scope = "friend_action"
    import logging
    from .models import Friendship, FriendRequest
    from .serializers import FriendRequestSerializer
    from notifications.services import push_service

    logger = logging.getLogger(__name__)

    logger.debug(
        f"FRIENDS_REQUEST_ACCEPT: user_id={request.user.id} request_id={request_id}"
    )

    try:
        friend_request = FriendRequest.objects.get(
            id=request_id, to_user=request.user, status=FriendRequest.Status.PENDING
        )
        logger.debug(f"FRIENDS_REQUEST_ACCEPT_FOUND: request_id={friend_request.id}")
    except FriendRequest.DoesNotExist:
        logger.warning(
            f"FRIENDS_REQUEST_ACCEPT_NOT_FOUND: request_id={request_id} user_id={request.user.id}"
        )
        return Response(
            {"error": _("Friend request not found or already processed.")},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        # Update request status
        friend_request.status = FriendRequest.Status.ACCEPTED
        friend_request.save()
        logger.debug(
            f"FRIENDS_REQUEST_ACCEPT_STATUS_UPDATED: request_id={friend_request.id} status=ACCEPTED"
        )

        # Create friendship (ensure consistent ordering)
        user1, user2 = friend_request.from_user, friend_request.to_user
        if user1.id > user2.id:
            user1, user2 = user2, user1

        friendship = Friendship.objects.create(user1=user1, user2=user2)
        logger.info(
            f"FRIENDS_REQUEST_ACCEPT_FRIENDSHIP_CREATED: friendship_id={friendship.id}"
        )

        # Send notification to the user who sent the request
        try:
            # Note: This method doesn't exist yet, we'll need to implement it
            notification_result = (
                push_service.send_friend_request_accepted_notification(friend_request)
            )
            logger.debug(
                f"FRIENDS_REQUEST_ACCEPT_NOTIFICATION: request_id={friend_request.id} result={notification_result}"
            )
        except Exception as e:
            logger.error(
                f"FRIENDS_REQUEST_ACCEPT_NOTIFICATION_ERROR: Failed to send notification for accepted friend request {friend_request.id}: {str(e)}"
            )

        serializer = FriendRequestSerializer(friend_request)
        logger.debug(f"FRIENDS_REQUEST_ACCEPT_COMPLETE: request_id={friend_request.id}")
        return Response(
            {
                "message": _("Friend request accepted."),
                "friend_request": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(
            f"FRIENDS_REQUEST_ACCEPT_ERROR: request_id={request_id} user_id={request.user.id} error={str(e)}"
        )
        return Response(
            {"error": "Failed to accept friend request"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def reject_friend_request(request, request_id):
    """Reject a friend request."""
    reject_friend_request.throttle_scope = "friend_action"
    import logging
    from .models import FriendRequest
    from .serializers import FriendRequestSerializer

    logger = logging.getLogger(__name__)

    logger.debug(
        f"FRIENDS_REQUEST_REJECT: user_id={request.user.id} request_id={request_id}"
    )

    try:
        friend_request = FriendRequest.objects.get(
            id=request_id, to_user=request.user, status=FriendRequest.Status.PENDING
        )
        logger.debug(f"FRIENDS_REQUEST_REJECT_FOUND: request_id={friend_request.id}")
    except FriendRequest.DoesNotExist:
        logger.warning(
            f"FRIENDS_REQUEST_REJECT_NOT_FOUND: request_id={request_id} user_id={request.user.id}"
        )
        return Response(
            {"error": _("Friend request not found or already processed.")},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        # Update request status
        friend_request.status = FriendRequest.Status.REJECTED
        friend_request.save()
        logger.debug(
            f"FRIENDS_REQUEST_REJECT_STATUS_UPDATED: request_id={friend_request.id} status=REJECTED"
        )

        serializer = FriendRequestSerializer(friend_request)
        logger.debug(f"FRIENDS_REQUEST_REJECT_COMPLETE: request_id={friend_request.id}")
        return Response(
            {
                "message": _("Friend request rejected."),
                "friend_request": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(
            f"FRIENDS_REQUEST_REJECT_ERROR: request_id={request_id} user_id={request.user.id} error={str(e)}"
        )
        return Response(
            {"error": "Failed to reject friend request"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def list_friend_requests(request):
    """List pending friend requests received by the authenticated user."""
    list_friend_requests.throttle_scope = "friend_read"
    import logging
    from .models import FriendRequest
    from .serializers import FriendRequestSerializer

    logger = logging.getLogger(__name__)

    logger.debug(f"FRIENDS_REQUEST_LIST: user_id={request.user.id}")

    try:
        friend_requests = (
            FriendRequest.objects.filter(
                to_user=request.user, status=FriendRequest.Status.PENDING
            )
            .select_related("from_user", "to_user")
            .order_by("-created_at")
        )

        request_count = friend_requests.count()
        logger.debug(
            f"FRIENDS_REQUEST_LIST_FOUND: count={request_count} user_id={request.user.id}"
        )

        # Avoid verbose per-item logging to keep logs concise

        serializer = FriendRequestSerializer(friend_requests, many=True)
        logger.debug(
            f"FRIENDS_REQUEST_LIST_COMPLETE: count={request_count} user_id={request.user.id}"
        )
        return Response(serializer.data)

    except Exception as e:
        logger.error(
            f"FRIENDS_REQUEST_LIST_ERROR: user_id={request.user.id} error={str(e)}"
        )
        return Response(
            {"error": "Failed to retrieve friend requests"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def list_friends(request):
    """List all friends of the authenticated user."""
    list_friends.throttle_scope = "friend_read"
    import logging
    from django.contrib.auth import get_user_model
    from .models import Friendship
    from .serializers import FriendshipSerializer

    logger = logging.getLogger(__name__)
    User = get_user_model()

    logger.debug(f"FRIENDS_LIST: user_id={request.user.id}")

    try:
        # Get all friendships involving the current user
        friendships = (
            Friendship.objects.filter(
                models.Q(user1=request.user) | models.Q(user2=request.user)
            )
            .select_related("user1", "user2")
            .order_by("-created_at")
        )

        friendship_count = friendships.count()
        logger.debug(
            f"FRIENDS_LIST_FOUND: count={friendship_count} user_id={request.user.id}"
        )

        # Extract friend data
        friends_data = []
        for friendship in friendships:
            friend = (
                friendship.user2
                if friendship.user1 == request.user
                else friendship.user1
            )
            profile_image_url = None
            if friend.profile_image:
                profile_image_url = request.build_absolute_uri(friend.profile_image.url)
            friends_data.append(
                {
                    "id": friend.id,
                    "username": friend.username,
                    "profile_image_url": profile_image_url,
                    "friendship_id": friendship.id,
                    "friendship_created_at": friendship.created_at,
                }
            )

        serializer = FriendshipSerializer(friends_data, many=True)
        logger.debug(
            f"FRIENDS_LIST_COMPLETE: count={friendship_count} user_id={request.user.id}"
        )
        return Response(serializer.data)

    except Exception as e:
        logger.error(f"FRIENDS_LIST_ERROR: user_id={request.user.id} error={str(e)}")
        return Response(
            {"error": "Failed to retrieve friends list"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def suggest_friends(request):
    """
    suggest_friends.throttle_scope = 'friend_read'
    Suggest friends based on friends of friends.
    Returns users ordered by number of mutual friends, then by username.
    """
    import logging
    from django.contrib.auth import get_user_model
    from .models import Friendship, FriendRequest
    from django.db.models import Count, Q

    logger = logging.getLogger(__name__)
    User = get_user_model()

    logger.debug(f"FRIENDS_SUGGEST: user_id={request.user.id}")

    try:
        # Get current user's friend IDs
        friendships = Friendship.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).values_list("user1_id", "user2_id")

        friend_ids = set()
        for user1_id, user2_id in friendships:
            friend_ids.add(user1_id)
            friend_ids.add(user2_id)
        friend_ids.discard(request.user.id)

        logger.debug(
            f"FRIENDS_SUGGEST_FRIENDS: count={len(friend_ids)} user_id={request.user.id}"
        )

        if not friend_ids:
            logger.debug(f"FRIENDS_SUGGEST_NO_FRIENDS: user_id={request.user.id}")
            return Response([])

        # Get friends of friends (excluding current user and existing friends)
        friends_of_friends_map = (
            {}
        )  # Maps suggested user ID to list of mutual friend IDs

        # Batch fetch all friendships for all friends in a single query
        fof_friendships = Friendship.objects.filter(
            Q(user1_id__in=friend_ids) | Q(user2_id__in=friend_ids)
        ).values_list("user1_id", "user2_id")

        # Process all friendships to build the friends-of-friends map
        for user1_id, user2_id in fof_friendships:
            # Determine which user is the friend and which is the friend-of-friend
            if user1_id in friend_ids:
                friend_id = user1_id
                fof_id = user2_id
            else:
                friend_id = user2_id
                fof_id = user1_id

            # Skip if it's the current user or already a friend
            if fof_id == request.user.id or fof_id in friend_ids:
                continue

            if fof_id not in friends_of_friends_map:
                friends_of_friends_map[fof_id] = []
            friends_of_friends_map[fof_id].append(friend_id)

        logger.debug(
            f"FRIENDS_SUGGEST_FOF: potential_count={len(friends_of_friends_map)}"
        )

        if not friends_of_friends_map:
            logger.debug(f"FRIENDS_SUGGEST_NO_FOF: user_id={request.user.id}")
            return Response([])

        # Get pending friend requests to exclude them (both sent and received)
        pending_requests = FriendRequest.objects.filter(
            Q(from_user=request.user) | Q(to_user=request.user),
            status=FriendRequest.Status.PENDING,
        ).values_list("from_user_id", "to_user_id")

        pending_user_ids = set()
        for from_id, to_id in pending_requests:
            # Add both users from the request
            pending_user_ids.add(from_id)
            pending_user_ids.add(to_id)
        # Remove current user from the set
        pending_user_ids.discard(request.user.id)

        logger.debug(f"FRIENDS_SUGGEST_PENDING: count={len(pending_user_ids)}")

        # Filter out users with pending requests from suggestions
        for user_id in pending_user_ids:
            friends_of_friends_map.pop(user_id, None)

        logger.debug(
            f"FRIENDS_SUGGEST_FILTERED: remaining={len(friends_of_friends_map)}"
        )

        if not friends_of_friends_map:
            logger.info(
                f"FRIENDS_SUGGEST_NO_AFTER_FILTER: No suggestions after filtering for user {request.user.id}"
            )
            return Response([])

        # Get user data for suggested friends
        suggested_user_ids = list(friends_of_friends_map.keys())
        users = User.objects.filter(id__in=suggested_user_ids)

        # Batch fetch all source friend usernames in a single query
        all_source_friend_ids = set()
        for mutual_friends in friends_of_friends_map.values():
            if mutual_friends:
                all_source_friend_ids.add(mutual_friends[0])

        source_friends_data = User.objects.filter(id__in=all_source_friend_ids).values(
            "id", "username"
        )
        source_friends_map = {sf["id"]: sf["username"] for sf in source_friends_data}

        # Build suggestions with mutual friend count and source friend
        suggestions = []
        for user in users:
            user_id = user.id
            mutual_friends = friends_of_friends_map[user_id]
            mutual_count = len(mutual_friends)

            # Get the first mutual friend's username (to show as source)
            source_friend_id = mutual_friends[0]
            source_friend_username = source_friends_map.get(source_friend_id)

            # Get profile image URL
            profile_image_url = None
            if user.profile_image:
                profile_image_url = request.build_absolute_uri(user.profile_image.url)

            suggestions.append(
                {
                    "id": str(user_id),
                    "username": user.username,
                    "profile_image_url": profile_image_url,
                    "mutual_friends_count": mutual_count,
                    "source_friend": source_friend_username,
                }
            )

            # avoid logging usernames in server logs

        # Sort by mutual friends count (descending) then by username (ascending)
        suggestions.sort(key=lambda x: (-x["mutual_friends_count"], x["username"]))

        # Limit to top 20 suggestions
        suggestions = suggestions[:20]

        logger.debug(
            f"FRIENDS_SUGGEST_COMPLETE: count={len(suggestions)} user_id={request.user.id}"
        )
        return Response(suggestions)

    except Exception as e:
        logger.error(f"FRIENDS_SUGGEST_ERROR: user_id={request.user.id} error={str(e)}")
        return Response(
            {"error": "Failed to generate friend suggestions"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def remove_friend(request, friend_id):
    """Remove a friend (delete the friendship)."""
    remove_friend.throttle_scope = "friend_action"
    import logging
    from django.contrib.auth import get_user_model
    from .models import Friendship

    logger = logging.getLogger(__name__)
    User = get_user_model()

    logger.debug(f"FRIENDS_REMOVE: user_id={request.user.id} friend_id={friend_id}")

    try:
        friend = User.objects.get(id=friend_id)
        logger.debug(f"FRIENDS_REMOVE_FRIEND_FOUND: friend_id={friend.id}")
    except User.DoesNotExist:
        logger.warning(f"FRIENDS_REMOVE_FRIEND_NOT_FOUND: friend_id={friend_id}")
        return Response(
            {"error": _("User not found.")}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Find and delete the friendship
        friendship = Friendship.objects.filter(
            models.Q(user1=request.user, user2=friend)
            | models.Q(user1=friend, user2=request.user)
        ).first()

        if not friendship:
            logger.warning(
                f"FRIENDS_REMOVE_NOT_FRIENDS: user_id={request.user.id} friend_id={friend.id}"
            )
            return Response(
                {"error": _("You are not friends with this user.")},
                status=status.HTTP_404_NOT_FOUND,
            )

        logger.info(f"FRIENDS_REMOVE_FRIENDSHIP_FOUND: friendship_id={friendship.id}")

        # Delete any existing friend requests between these users (in both directions)
        from .models import FriendRequest

        friend_requests = FriendRequest.objects.filter(
            models.Q(from_user=request.user, to_user=friend)
            | models.Q(from_user=friend, to_user=request.user)
        )

        if friend_requests.exists():
            logger.debug(
                f"FRIENDS_REMOVE_CLEANUP_REQUESTS: count={friend_requests.count()} user_id={request.user.id} friend_id={friend.id}"
            )
            friend_requests.delete()
            logger.debug("FRIENDS_REMOVE_CLEANUP_REQUESTS_SUCCESS")

        friendship.delete()
        logger.info(f"FRIENDS_REMOVE_SUCCESS: friendship_id={friendship.id}")

        return Response(
            {"message": _("Friend removed successfully.")}, status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(
            f"FRIENDS_REMOVE_ERROR: friend_id={friend_id} user_id={request.user.id} error={str(e)}"
        )
        return Response(
            {"error": "Failed to remove friend"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class EventMapViewSet(ApiLoggingMixin, viewsets.ModelViewSet):
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
        from django.db.models import Count, Q

        queryset = EventMap.objects.select_related("event").prefetch_related(
            "locations"
        )

        # Add annotation for active locations count to avoid N+1 queries
        queryset = queryset.annotate(
            active_locations_count=Count(
                "locations", filter=Q(locations__is_active=True)
            )
        )

        # For public access, only show active maps for visible events
        if not self.request.user.is_authenticated:
            return queryset.filter(is_active=True, event__visible=True)

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
        return queryset.filter(is_active=True, event__visible=True)

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return EventMapCreateSerializer
        return EventMapSerializer

    def perform_create(self, serializer):
        """Create event map with organization authentication."""
        from .authentication import get_current_organization

        organization = get_current_organization(self.request)
        if not organization:
            logger.warning("Event map creation failed: No authenticated organization")
            raise serializers.ValidationError(_("No authenticated organization found."))

        # The serializer handles the actual creation
        event_map = serializer.save()
        logger.info(
            f"Event map created: map_id={event_map.id} event_id={event_map.event_id} org_id={organization.id}"
        )
        return event_map

    @action(detail=True, methods=["post"], url_path="add-location")
    def add_location(self, request, pk=None):
        """Add a location to an existing event map."""
        logger.debug(f"Event map location addition attempt: map_id={pk}")
        event_map = self.get_object()

        # Check if organization owns the event
        from .authentication import get_current_organization

        organization = get_current_organization(request)
        if not organization or str(event_map.event.organization_id) != str(
            organization.id
        ):
            logger.warning(
                f"Event map location addition denied: map_id={event_map.id} org_id={event_map.event.organization_id}"
            )
            return Response(
                {"error": _("You do not have permission to modify this event map.")},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = EventMapLocationCreateSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            # Override the event_slug validation since we already have the event_map
            validated_data = serializer.validated_data.copy()
            validated_data["event_slug"] = event_map.event.slug

            location = EventMapLocation.objects.create(
                event_map=event_map,
                name=validated_data["name"],
                description=validated_data.get("description") or None,
                latitude=validated_data["latitude"],
                longitude=validated_data["longitude"],
                address=validated_data.get("address") or None,
                order_index=validated_data.get("order_index", 0),
                is_active=True,
            )

            logger.info(
                f"Event map location added: location_id={location.id} map_id={event_map.id} name={location.name}"
            )
            return Response(
                EventMapLocationSerializer(location).data,
                status=status.HTTP_201_CREATED,
            )

        logger.warning(
            f"Event map location addition validation failed: map_id={event_map.id} errors={serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"], url_path="locations")
    def get_locations(self, request, pk=None):
        """Get all locations for an event map."""
        logger.debug(f"Fetching locations for event map: map_id={pk}")
        event_map = self.get_object()
        locations = event_map.locations.filter(is_active=True).order_by("order_index")
        logger.info(
            f"Event map locations retrieved: map_id={event_map.id} locations_count={locations.count()}"
        )
        serializer = EventMapLocationSerializer(locations, many=True)
        return Response(serializer.data)


class EventMapLocationViewSet(ApiLoggingMixin, viewsets.ModelViewSet):
    """
    ViewSet for managing individual event map locations.
    """

    queryset = EventMapLocation.objects.all()
    serializer_class = EventMapLocationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_queryset(self):
        """Filter locations based on authentication and permissions."""
        queryset = EventMapLocation.objects.select_related("event_map__event")

        # For public access, only show active locations for visible events
        if not self.request.user.is_authenticated:
            return queryset.filter(
                is_active=True,
                event_map__is_active=True,
                event_map__event__visible=True,
            )

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
        return queryset.filter(
            is_active=True, event_map__is_active=True, event_map__event__visible=True
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == "create":
            return EventMapLocationCreateSerializer
        return EventMapLocationSerializer

    def perform_create(self, serializer):
        """Create event map location with organization authentication."""
        from .authentication import get_current_organization

        organization = get_current_organization(self.request)
        if not organization:
            logger.warning(
                "Event map location creation failed: No authenticated organization"
            )
            raise serializers.ValidationError(_("No authenticated organization found."))

        # The serializer handles the actual creation
        location = serializer.save()
        logger.info(
            f"Event map location created: location_id={location.id} map_id={location.event_map_id} name={location.name}"
        )
        return location

    def perform_update(self, serializer):
        """Update event map location with organization authentication."""
        from .authentication import get_current_organization

        organization = get_current_organization(self.request)
        if not organization:
            logger.warning(
                "Event map location update failed: No authenticated organization"
            )
            raise serializers.ValidationError(_("No authenticated organization found."))

        # Check if organization owns the event
        if str(serializer.instance.event_map.event.organization_id) != str(
            organization.id
        ):
            logger.warning(
                f"Event map location update denied: location_id={serializer.instance.id} org_id={serializer.instance.event_map.event.organization_id}"
            )
            raise serializers.ValidationError(
                _("You do not have permission to modify this event map location.")
            )

        location = serializer.save()
        logger.info(
            f"Event map location updated: location_id={location.id} map_id={location.event_map_id}"
        )
        return location

    def perform_destroy(self, instance):
        """Delete event map location with organization authentication."""
        from .authentication import get_current_organization

        organization = get_current_organization(self.request)
        if not organization:
            logger.warning(
                "Event map location deletion failed: No authenticated organization"
            )
            raise serializers.ValidationError(_("No authenticated organization found."))

        # Check if organization owns the event
        if str(instance.event_map.event.organization_id) != str(organization.id):
            logger.warning(
                f"Event map location deletion denied: location_id={instance.id} org_id={instance.event_map.event.organization_id}"
            )
            raise serializers.ValidationError(
                _("You do not have permission to delete this event map location.")
            )

        logger.info(
            f"Event map location deleted: location_id={instance.id} map_id={instance.event_map_id}"
        )
        instance.delete()


def health_check(request):
    """
    Health check endpoint that returns 200 if everything is OK.
    """
    logger.debug("Health check endpoint called")
    return JsonResponse({"status": "ok"}, status=200)
