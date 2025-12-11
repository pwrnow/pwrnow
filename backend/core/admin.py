from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse, path
from django.utils.safestring import mark_safe
from django.utils.text import Truncator
from django.conf import settings
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.contrib.admin import SimpleListFilter
from django.db import models
from django.shortcuts import redirect, get_object_or_404, render
from django.http import HttpResponseRedirect
from modeltranslation.admin import (
    TranslationAdmin,
    TranslationTabularInline,
    TranslationStackedInline,
)
from adminsortable2.admin import SortableAdminMixin
from .models import (
    Event,
    Category,
    Organization,
    Tag,
    OrganizationCode,
    Like,
    Post,
    PostImage,
    Schedule,
    ScheduleItem,
    QRCode,
    EventParticipation,
    EventMap,
    EventMapLocation,
    Friendship,
    FriendRequest,
    EventCoHost,
)
from .forms import OrganizationAdminForm, EventAdminForm
from ai.services import EventExtractionService
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from import_export import fields


# Custom filters
class HasImageFilter(SimpleListFilter):
    title = _("has image")
    parameter_name = "has_image"

    def lookups(self, request, model_admin):
        return (
            ("yes", _("Yes")),
            ("no", _("No")),
        )

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.exclude(image__isnull=True).exclude(image="")
        elif self.value() == "no":
            return queryset.filter(models.Q(image__isnull=True) | models.Q(image=""))


class EventStatusFilter(SimpleListFilter):
    title = _("status")
    parameter_name = "event_status"

    def lookups(self, request, model_admin):
        return (
            ("past", _("Past")),
            ("ongoing", _("Ongoing")),
            ("upcoming", _("Upcoming")),
        )

    def queryset(self, request, queryset):
        now = timezone.now()
        if self.value() == "past":
            return queryset.filter(ends_at__lt=now)
        elif self.value() == "ongoing":
            return queryset.filter(starts_at__lte=now, ends_at__gte=now)
        elif self.value() == "upcoming":
            return queryset.filter(starts_at__gt=now)


class HasAspectRatioFilter(SimpleListFilter):
    title = _("aspect ratio")
    parameter_name = "has_aspect_ratio"

    def lookups(self, request, model_admin):
        return (
            ("yes", _("Yes")),
            ("no", _("No")),
        )

    def queryset(self, request, queryset):
        if self.value() == "yes":
            return queryset.exclude(aspect_ratio__isnull=True).exclude(aspect_ratio="")
        elif self.value() == "no":
            return queryset.filter(
                models.Q(aspect_ratio__isnull=True) | models.Q(aspect_ratio="")
            )


@admin.register(Category)
class CategoryAdmin(SortableAdminMixin, TranslationAdmin):
    """Category admin with drag-and-drop sorting support."""

    list_display = [
        "name",
        "slug",
        "order_index",
        "event_count",
        "created_at",
        "updated_at",
    ]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["order_index", "name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    date_hierarchy = "created_at"

    # Translation-specific configurations - let TranslationAdmin handle fieldsets automatically
    # This will create tabs/sections for Polish and English translations
    group_fieldsets = True

    @admin.display(description="Events")
    def event_count(self, obj):
        count = obj.events.count()
        url = reverse("admin:core_event_changelist") + f"?category__id__exact={obj.id}"
        return format_html('<a href="{}">{} events</a>', url, count)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "event_count", "created_at", "updated_at"]
    list_filter = ["created_at", "updated_at"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    date_hierarchy = "created_at"

    @admin.display(description="Events")
    def event_count(self, obj):
        count = obj.events.count()
        return f"{count} events"


class OrganizationCodeInline(admin.TabularInline):
    model = OrganizationCode
    extra = 0
    readonly_fields = ["code", "created_at", "last_used_at"]
    fields = ["code", "type", "created_at", "last_used_at"]


class OrganizationCodeResource(resources.ModelResource):
    organization_name = fields.Field(
        attribute="organization__name", column_name="Organization Name"
    )
    url = fields.Field(column_name="URL")

    class Meta:
        model = OrganizationCode
        fields = [
            "organization",
            "organization_name",
            "code",
            "url",
            "created_at",
            "last_used_at",
        ]

    def dehydrate_url(self, obj):
        if settings.DEBUG:
            base_url = "http://localhost:3000"
        else:
            base_url = "https://pwrnow.pl"

        return f"{base_url}/auth/{obj.code}"


@admin.register(OrganizationCode)
class OrganizationCodeAdmin(ImportExportModelAdmin):
    list_display = ["organization", "type", "last_used_at", "url_actions"]
    list_filter = ["type", "organization"]
    search_fields = ["organization__name", "code"]
    readonly_fields = ["code", "created_at", "last_used_at"]
    ordering = ["-last_used_at"]

    fieldsets = (
        (_("Organization"), {"fields": ("organization",)}),
        (_("Code Details"), {"fields": ("code", "type")}),
        (_("Usage Information"), {"fields": ("created_at", "last_used_at")}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("organization")

    resource_class = OrganizationCodeResource

    def _get_base_url(self):
        """Get the base URL for auth links."""
        return "http://localhost:3000" if settings.DEBUG else "https://pwrnow.pl"

    def _get_auth_url(self, code):
        """Get the full authentication URL for a code."""
        return f"{self._get_base_url()}/auth/{code}"

    @admin.display(description=_("URL Actions"))
    def url_actions(self, obj):
        """Display buttons to copy and visit the URL."""
        auth_url = self._get_auth_url(obj.code)

        # Copy URL button
        copy_url_btn = format_html(
            """
            <button type="button"
                    onclick="(function(e) {{
                        navigator.clipboard.writeText('{}').then(() => {{
                            const btn = e.target;
                            const orig = btn.innerHTML;
                            btn.innerHTML = '✓ Copied!';
                            btn.style.backgroundColor = '#28a745';
                            setTimeout(() => {{ btn.innerHTML = orig; btn.style.backgroundColor = '#17a2b8'; }}, 1500);
                        }}).catch(() => alert('Failed to copy URL'));
                    }})(event)"
                    style="background-color: #17a2b8; color: white; padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; margin-right: 6px; font-size: 12px; font-weight: 500;">
                Copy URL
            </button>
            """,
            auth_url,
        )

        # Visit URL button
        visit_btn = format_html(
            """
            <a href="{}" target="_blank"
               style="background-color: #28a745; color: white; padding: 5px 12px; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; display: inline-block;">
                Visit URL
            </a>
            """,
            auth_url,
        )

        return format_html(
            '<div style="white-space: nowrap;">{}{}</div>', copy_url_btn, visit_btn
        )


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    form = OrganizationAdminForm
    list_display = [
        "name",
        "short_name",
        "image_preview",
        "last_active",
        "auth_link",
        "auth_codes_count",
        "event_count",
        "co_hosted_events_count",
        "has_image",
    ]
    list_filter = ["created_at", "updated_at", HasImageFilter]
    search_fields = ["name", "short_name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [OrganizationCodeInline]
    date_hierarchy = None

    def get_queryset(self, request):
        from django.db.models import Count

        qs = super().get_queryset(request)
        return qs.prefetch_related("auth_codes", "co_hosted_events").annotate(
            auth_codes_total=Count("auth_codes", distinct=True),
            events_total=Count("events", distinct=True),
            co_hosted_events_total=Count("co_hosted_events", distinct=True),
        )

    @admin.display(description="Has Image", boolean=True)
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(description="Co-hosted Events")
    def co_hosted_events_count(self, obj):
        # Use annotated value to avoid N+1 queries
        count = (
            obj.co_hosted_events_total
            if hasattr(obj, "co_hosted_events_total")
            else obj.co_hosted_events.count()
        )
        if count == 0:
            return format_html('<span style="color: #999;">0</span>')
        url = (
            reverse("admin:core_eventcohost_changelist")
            + f"?organization__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} events</a>', url, count)

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("name", "short_name", "slug", "image"),
                "description": "You can paste images directly from your clipboard in the image field below. Short name is used for display in event headers when space is limited.",
            },
        ),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Image")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="30" height="30" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "No image"

    @admin.display(description="Last Active", ordering="auth_codes__last_used_at")
    def last_active(self, obj):
        """Show the most recent last_used_at from organization codes (excluding admin codes)."""
        # Get the most recent last_used_at from organization auth codes only (filter out admin)
        # Use prefetched data to avoid N+1 queries
        from .models import OrganizationCode

        auth_codes_with_date = [
            code
            for code in obj.auth_codes.all()
            if code.last_used_at and code.type == OrganizationCode.CodeType.ORGANIZATION
        ]
        if auth_codes_with_date:
            last_used = max(auth_codes_with_date, key=lambda x: x.last_used_at)
            if last_used.last_used_at:
                now = timezone.now()
                time_diff = now - last_used.last_used_at

                if time_diff.days > 0:
                    return format_html(
                        '<span title="{}">{} days ago</span>',
                        last_used.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                        time_diff.days,
                    )
                elif time_diff.seconds > 3600:
                    hours = time_diff.seconds // 3600
                    return format_html(
                        '<span title="{}">{} hours ago</span>',
                        last_used.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                        hours,
                    )
                elif time_diff.seconds > 60:
                    minutes = time_diff.seconds // 60
                    return format_html(
                        '<span title="{}">{} minutes ago</span>',
                        last_used.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                        minutes,
                    )
                else:
                    return format_html(
                        '<span title="{}">Just now</span>',
                        last_used.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                    )
        return format_html('<span style="color: #999;">Never</span>')

    @admin.display(description="Auth Link")
    def auth_link(self, obj):
        """Display a button to navigate to any auth code URL for this organization."""
        # Get any auth code for this organization
        auth_code = obj.auth_codes.first()
        if auth_code:
            base_url = (
                "http://localhost:3000" if settings.DEBUG else "https://pwrnow.pl"
            )
            url = f"{base_url}/auth/{auth_code.code}"
            return format_html(
                '<a href="{}" target="_blank" style="background-color: #007bff; color: white; padding: 4px 8px; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">🔗 Open Auth</a>',
                url,
            )
        return format_html('<span style="color: #999;">No code</span>')

    @admin.display(description="Auth Codes")
    def auth_codes_count(self, obj):
        # Use annotated value to avoid N+1 queries
        count = (
            obj.auth_codes_total
            if hasattr(obj, "auth_codes_total")
            else obj.auth_codes.count()
        )
        url = (
            reverse("admin:core_organizationcode_changelist")
            + f"?organization__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} codes</a>', url, count)

    @admin.display(description="Events")
    def event_count(self, obj):
        # Use annotated value to avoid N+1 queries
        count = obj.events_total if hasattr(obj, "events_total") else obj.events.count()
        url = (
            reverse("admin:core_event_changelist")
            + f"?organization__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} events</a>', url, count)


@admin.register(Event)
class EventAdmin(TranslationAdmin):
    form = EventAdminForm
    list_display = [
        "image_preview",
        "compact_title",
        "compact_dates",
        "compact_status",
        "verified",
        "likes_count_display",
    ]
    list_filter = [
        "verified",
        EventStatusFilter,
        "category",
        "organization",
        HasImageFilter,
    ]
    search_fields = [
        "title_pl",
        "title_en",
        "description_pl",
        "description_en",
        "location",
        "slug",
    ]
    prepopulated_fields = {"slug": ("title",)}
    list_editable = ["verified"]
    date_hierarchy = None  # Removed date hierarchy for more compact view
    ordering = ["verified", "-created_at"]  # Non-verified first
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "duration_display",
        "verified_at",
        "verified_by",
        "likes_count_display",
        "has_image",
        "has_url",
    ]
    autocomplete_fields = ["category", "organization"]
    filter_horizontal = ["tags"]

    @admin.display(description="Has Image", boolean=True)
    def has_image(self, obj):
        return bool(obj.image)

    @admin.display(description="Has URL", boolean=True)
    def has_url(self, obj):
        return bool(obj.url)

    # Translation-specific configurations
    group_fieldsets = True

    fieldsets = (
        (
            "AI Auto-Fill",
            {
                "fields": ("ai_image",),
                "description": 'Upload an image here to auto-fill the event details below. Click "Process Image with AI" after selecting a file.',
                "classes": ("open",),
            },
        ),
        ("Basic Information", {"fields": ("title", "slug", "description", "category")}),
        (
            "Timing",
            {
                "fields": (
                    "starts_at",
                    "ends_at",
                    "publication_date",
                    "duration_display",
                )
            },
        ),
        ("Location & Links", {"fields": ("location", "url", "image", "aspect_ratio")}),
        ("Organization & Tags", {"fields": ("organization", "tags")}),
        ("Status", {"fields": ("verified", "verified_at", "verified_by")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Title")
    def compact_title(self, obj):
        title = Truncator(obj.title).chars(60)
        verified_badge = ""
        if not obj.verified:
            verified_badge = format_html(
                '<span style="background-color: #EF4444; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-right: 4px;">UNVERIFIED</span>'
            )
        change_url = reverse("admin:core_event_change", args=[obj.pk])
        title_link = format_html('<a href="{}">{}</a>', change_url, title)
        return format_html("{} {}", verified_badge, title_link)

    compact_title.admin_order_field = "title"

    @admin.display(description="Image")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return format_html(
            '<span style="color: #999; font-size: 11px;">No image</span>'
        )

    @admin.display(description="Dates")
    def compact_dates(self, obj):
        """Compact date display showing start date and status."""
        if obj.starts_at:
            date_str = obj.starts_at.strftime("%Y-%m-%d %H:%M")
        else:
            date_str = "No date"

        status_color = (
            "#dc3545" if obj.is_past else "#28a745" if obj.is_ongoing else "#007bff"
        )
        status_text = (
            "Past" if obj.is_past else "Ongoing" if obj.is_ongoing else "Upcoming"
        )
        status_badge = format_html(
            '<span style="background-color: {}; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">{}</span>',
            status_color,
            status_text,
        )

        # Show scheduled publication date for upcoming events that are not yet published
        publication_info = ""
        if status_text == "Upcoming" and obj.publication_date:
            today = timezone.localdate()
            if obj.publication_date > today:
                pub_date_str = obj.publication_date.strftime("%Y-%m-%d")
                publication_info = format_html(
                    '<div style="color: #d97706; font-size: 10px; margin-top: 2px;">Scheduled: {}</div>',
                    pub_date_str,
                )

        return format_html("{} {}{}", date_str, status_badge, publication_info)

    compact_dates.admin_order_field = "starts_at"

    @admin.display(description="Status")
    def compact_status(self, obj):
        """Compact status display with verification and other info."""
        verified_icon = "✓" if obj.verified else "✗"
        verified_color = "#10B981" if obj.verified else "#EF4444"
        verified_text = format_html(
            '<span style="color: {}; font-weight: bold; margin-right: 8px;">{}</span>',
            verified_color,
            verified_icon,
        )

        org = obj.organization.name if obj.organization else "-"
        cat = obj.category.name if obj.category else "-"
        info = format_html(
            '<span style="font-size: 11px; color: #666;">{} / {}</span>', cat, org
        )
        return format_html("{} {}", verified_text, info)

    @admin.display(description="Aspect Ratio")
    def aspect_ratio_display(self, obj):
        if obj.aspect_ratio:
            # Add some styling to make it stand out
            return format_html(
                '<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
                obj.aspect_ratio,
            )
        return format_html(
            '<span style="color: #999; font-style: italic;">Not set</span>'
        )

    @admin.display(description="Status")
    def status_display(self, obj):
        if obj.is_past:
            color = "#dc3545"  # red
            status = "Past"
        elif obj.is_ongoing:
            color = "#28a745"  # green
            status = "Ongoing"
        else:
            color = "#007bff"  # blue
            status = "Upcoming"

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>', color, status
        )

    @admin.display(description="Duration")
    def duration_display(self, obj):
        if obj.starts_at and obj.ends_at:
            duration = obj.duration
            hours = duration.total_seconds() // 3600
            minutes = (duration.total_seconds() % 3600) // 60

            if hours > 0:
                if minutes > 0:
                    return f"{hours}h {minutes}m"
                else:
                    return f"{hours}h"
            else:
                return f"{minutes}m"
        return "N/A"

    @admin.display(description="Likes")
    def likes_count_display(self, obj):
        count = obj.likes_count
        return format_html('<span style="color: #10b981;">❤️ {}</span>', count)

    likes_count_display.short_description = "Likes"

    @admin.display(description="Verified By")
    def verified_by_display(self, obj):
        if obj.verified_by:
            return format_html(
                '<span style="color: #10B981;">{}</span>', obj.get_verified_by_display()
            )
        return format_html('<span style="color: #EF4444;">Not verified</span>')

    verified_by_display.short_description = "Verified By"

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)
        if "ai_extracted_data" in request.session:
            data = request.session.pop("ai_extracted_data")

            # Convert date strings to datetime objects
            from django.utils.dateparse import parse_datetime

            for field in ["starts_at", "ends_at"]:
                if field in data and isinstance(data[field], str):
                    try:
                        dt = parse_datetime(data[field])
                        if dt:
                            if timezone.is_naive(dt):
                                dt = timezone.make_aware(dt)
                            data[field] = dt
                    except (ValueError, TypeError):
                        pass

            initial.update(data)
            self.message_user(
                request, "Event details auto-filled from image!", level=messages.SUCCESS
            )
        return initial

    def add_view(self, request, form_url="", extra_context=None):
        if request.method == "POST" and "_process_ai_image" in request.POST:
            image = request.FILES.get("ai_image")
            if image:
                try:
                    service = EventExtractionService()
                    # Pass organization if available
                    org = None
                    if hasattr(request.user, "organization__name"):
                        org = request.user.organization

                    # Get categories for AI selection
                    categories = list(Category.objects.all().values("id", "name"))
                    category_names = [c["name"] for c in categories]

                    # Get organizations for AI selection
                    organizations = list(
                        Organization.objects.all().values("id", "name")
                    )
                    organization_names = [o["name"] for o in organizations]

                    result = service.extract_event_info(
                        image,
                        org,
                        request.user,
                        categories=category_names,
                        organizations=organization_names,
                    )

                    if result["success"]:
                        data = result["data"]

                        # Map extracted category name to ID
                        category_id = None
                        extracted_cat_name = data.get("category")
                        if extracted_cat_name:
                            # Case-insensitive match
                            for cat in categories:
                                if cat["name"].lower() == extracted_cat_name.lower():
                                    category_id = str(cat["id"])
                                    break

                        # Map extracted organization name to ID
                        organization_id = None
                        extracted_org_name = data.get("organization")
                        if extracted_org_name:
                            # Case-insensitive match
                            for org_obj in organizations:
                                if (
                                    org_obj["name"].lower()
                                    == extracted_org_name.lower()
                                ):
                                    organization_id = str(org_obj["id"])
                                    break

                        # Auto-generate slug from title
                        from django.utils.text import slugify

                        slug = None
                        title = data.get("title_pl") or data.get("title_en")
                        if title:
                            slug = slugify(title)

                        # Handle tags
                        # tag_ids = []
                        # extracted_tags = data.get('tags', [])
                        # if extracted_tags and isinstance(extracted_tags, list):
                        #     for tag_name in extracted_tags:
                        #         if isinstance(tag_name, str):
                        #             # Create tag if it doesn't exist
                        #             tag_slug = slugify(tag_name)
                        #             if tag_slug:
                        #                 tag, created = Tag.objects.get_or_create(
                        #                     slug=tag_slug,
                        #                     defaults={'name': tag_name}
                        #                 )
                        #                 tag_ids.append(str(tag.id))

                        # Map extracted fields to model fields
                        extracted = {
                            "title_pl": data.get("title_pl"),
                            "title_en": data.get("title_en"),
                            "description_pl": data.get("description_pl"),
                            "description_en": data.get("description_en"),
                            "location": data.get("location"),
                            "url": data.get("url"),
                            "starts_at": data.get("starts_at"),
                            "ends_at": data.get("ends_at"),
                            "category": category_id,
                            "organization": organization_id,
                            "slug": slug,
                            # 'tags': tag_ids,
                        }
                        # Remove empty values
                        extracted = {k: v for k, v in extracted.items() if v}

                        request.session["ai_extracted_data"] = extracted
                        return HttpResponseRedirect(request.path)
                    else:
                        self.message_user(
                            request,
                            f"AI Extraction failed: {result.get('error')}",
                            level=messages.ERROR,
                        )
                except Exception as e:
                    self.message_user(
                        request,
                        f"Error processing image: {str(e)}",
                        level=messages.ERROR,
                    )

        return super().add_view(request, form_url, extra_context)

    # Removed schedule_manage_link from Event admin per request

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("category", "organization", "verified_by")
            .prefetch_related("tags")
        )

    actions = [
        "mark_as_verified",
        "mark_as_unverified",
        "detect_aspect_ratios",
        "send_event_publication_notifications",
        "send_event_reminder_24h",
        "send_manual_reminder",
        "translate_selected_events",
    ]

    def mark_as_verified(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f"{updated} events marked as verified.")

    mark_as_verified.short_description = "Mark selected events as verified"

    def mark_as_unverified(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f"{updated} events marked as unverified.")

    mark_as_unverified.short_description = "Mark selected events as unverified"

    def detect_aspect_ratios(self, request, queryset):
        """Trigger aspect ratio detection for selected events."""
        queued_count = 0
        skipped_count = 0

        for event in queryset:
            if not event.image:
                skipped_count += 1
                continue

            # Trigger the aspect ratio detection task
            try:
                from .tasks import detect_event_image_aspect_ratio

                detect_event_image_aspect_ratio.delay(str(event.id))
                queued_count += 1
            except Exception as e:
                # Fallback to synchronous processing if Celery is unavailable
                try:
                    from .tasks import detect_event_image_aspect_ratio

                    detect_event_image_aspect_ratio(str(event.id))
                    queued_count += 1
                except Exception:
                    skipped_count += 1

        if queued_count:
            self.message_user(
                request, f"Aspect ratio detection queued for {queued_count} events."
            )
        if skipped_count:
            level = (
                messages.WARNING if skipped_count == queryset.count() else messages.INFO
            )
            self.message_user(
                request, f"Skipped {skipped_count} events (no image).", level=level
            )

    detect_aspect_ratios.short_description = "Detect aspect ratios for selected events"

    def send_event_publication_notifications(self, request, queryset):
        """Send publication notifications for selected events regardless of publication date."""
        # Filter only verified events
        verified_events = queryset.filter(verified=True)
        if not verified_events.exists():
            self.message_user(
                request,
                "No verified events selected. Please select verified events only.",
                level=messages.WARNING,
            )
            return

        try:
            from notifications.services import push_service

            result = push_service.send_publication_notifications_for_events(
                verified_events
            )

            if result["sent"] > 0:
                self.message_user(
                    request,
                    f'Successfully sent publication notifications for {len(verified_events)} events: {result["sent"]} sent, {result["failed"]} failed.',
                )
            else:
                self.message_user(
                    request,
                    f'Failed to send publication notifications: {result["failed"]} failed.',
                    level=messages.ERROR,
                )
        except Exception as e:
            self.message_user(
                request,
                f"Error sending publication notifications: {str(e)}",
                level=messages.ERROR,
            )

    send_event_publication_notifications.short_description = (
        "Send event publication notifications"
    )

    def send_event_reminder_24h(self, request, queryset):
        """Manually trigger 24h reminder notifications for selected verified events (ignores time window)."""
        verified_events = queryset.filter(verified=True)
        if not verified_events.exists():
            self.message_user(
                request,
                "No verified events selected. Please select verified events only.",
                level=messages.WARNING,
            )
            return

        try:
            from notifications.services import push_service

            result = push_service.send_event_reminders_for_events(verified_events)

            if result["sent"] > 0:
                self.message_user(
                    request,
                    f'Successfully sent reminder notifications: {result["sent"]} sent, {result["failed"]} failed.',
                )
            else:
                self.message_user(
                    request,
                    f'Failed to send reminders: {result["failed"]} failed.',
                    level=messages.ERROR,
                )
        except Exception as e:
            self.message_user(
                request, f"Error sending reminders: {str(e)}", level=messages.ERROR
            )

    send_event_reminder_24h.short_description = (
        "Send 24h reminder notifications (manual)"
    )

    def send_manual_reminder(self, request, queryset):
        """Send manual reminder with message selection for a single event."""
        if queryset.count() != 1:
            self.message_user(
                request,
                _("Please select exactly one event for manual reminder."),
                level=messages.WARNING,
            )
            return

        event = queryset.first()

        if not event.verified:
            self.message_user(
                request,
                _("Only verified events can have reminders sent."),
                level=messages.WARNING,
            )
            return

        # Redirect to the custom reminder view
        return HttpResponseRedirect(
            reverse("admin:core_event_send_reminder", args=[event.pk])
        )

    send_manual_reminder.short_description = _(
        "Send manual reminder (with message selection)"
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<uuid:event_id>/send-reminder/",
                self.admin_site.admin_view(self.send_reminder_view),
                name="core_event_send_reminder",
            ),
        ]
        return custom_urls + urls

    def send_reminder_view(self, request, event_id):
        """Custom view for sending manual reminders with message selection."""
        from notifications.reminder_messages import (
            get_message_choices_for_event,
            get_time_bracket,
        )
        from notifications.services import push_service
        from notifications.models import Device

        event = get_object_or_404(Event, pk=event_id)

        if not event.verified:
            messages.error(request, _("Only verified events can have reminders sent."))
            return HttpResponseRedirect(reverse("admin:core_event_changelist"))

        # Calculate time info
        now = timezone.now()
        if event.starts_at:
            time_diff = event.starts_at - now
            hours_until = time_diff.total_seconds() / 3600
        else:
            hours_until = 0

        bracket_key, bracket_display = get_time_bracket(hours_until)
        message_choices = get_message_choices_for_event(event, now)

        # Get target users and devices
        liked_user_ids = list(
            Like.objects.filter(event=event).values_list("user_id", flat=True)
        )
        devices = Device.objects.filter(
            user_id__in=liked_user_ids, notifications_enabled=True
        )

        context = {
            "title": _("Send Manual Reminder"),
            "event": event,
            "hours_until": hours_until,
            "bracket_display": str(bracket_display),
            "messages": message_choices,
            "liked_users_count": len(liked_user_ids),
            "devices_count": devices.count(),
            "opts": self.model._meta,
            "site_header": admin.site.site_header,
            "site_title": admin.site.site_title,
        }

        # Handle form submission
        step = request.POST.get("step", request.GET.get("step", "select"))

        if step == "confirm":
            # User selected a message, show confirmation
            message_id = int(request.POST.get("message_id", 0))
            if 0 <= message_id < len(message_choices):
                selected_message = message_choices[message_id]
            else:
                selected_message = message_choices[0] if message_choices else None

            context["step"] = "confirm"
            context["selected_message"] = selected_message

        elif step == "send":
            # User confirmed, send the notifications
            message_id = int(request.POST.get("message_id", 0))
            if 0 <= message_id < len(message_choices):
                selected_message = message_choices[message_id]
            else:
                selected_message = message_choices[0] if message_choices else None

            if selected_message and devices.exists():
                # Prepare and send notifications
                all_notifications_data = []

                for device in devices:
                    notification_data = {
                        "to": device.expo_push_token,
                        "title": selected_message["title"],
                        "body": selected_message["body"],
                        "data": {
                            "type": "manual_reminder",
                            "event_id": str(event.id),
                            "event_slug": event.slug,
                            "organization_slug": (
                                event.organization.slug if event.organization else None
                            ),
                            "category_slug": (
                                event.category.slug if event.category else None
                            ),
                            "url": event.public_url,
                        },
                        "priority": "high",
                        "channelId": "events",
                        "sound": "default",
                    }
                    all_notifications_data.append(notification_data)

                result = push_service.send_multiple_notifications(
                    all_notifications_data
                )

                context["step"] = "success"
                context["sent_count"] = result["sent"]
                context["failed_count"] = result["failed"]
            else:
                context["step"] = "success"
                context["sent_count"] = 0
                context["failed_count"] = 0
        else:
            # Default: show message selection
            context["step"] = "select"

        return render(
            request, "admin/notifications/send_event_reminder_form.html", context
        )

    def translate_selected_events(self, request, queryset):
        """Trigger AI translation for selected events with missing translations."""
        from django.db.models import Q

        # Filter events that need translation (have at least one empty translation field)
        events_needing_translation = queryset.filter(
            Q(title_pl__isnull=False, title_pl__gt="", title_en__isnull=True)
            | Q(title_pl__isnull=False, title_pl__gt="", title_en="")
            | Q(title_en__isnull=False, title_en__gt="", title_pl__isnull=True)
            | Q(title_en__isnull=False, title_en__gt="", title_pl="")
            | Q(
                description_pl__isnull=False,
                description_pl__gt="",
                description_en__isnull=True,
            )
            | Q(description_pl__isnull=False, description_pl__gt="", description_en="")
            | Q(
                description_en__isnull=False,
                description_en__gt="",
                description_pl__isnull=True,
            )
            | Q(description_en__isnull=False, description_en__gt="", description_pl="")
        ).distinct()

        events_count = events_needing_translation.count()

        if events_count == 0:
            self.message_user(
                request,
                "No events selected that need translation. All selected events already have complete translations.",
                level=messages.WARNING,
            )
            return

        queued_count = 0
        failed_count = 0

        for event in events_needing_translation:
            try:
                from .tasks import translate_event_content

                # Queue the translation task asynchronously
                translate_event_content.delay(str(event.id))
                queued_count += 1
            except Exception as e:
                failed_count += 1
                # Log error but continue processing other events
                import logging

                logger = logging.getLogger(__name__)
                logger.error(
                    f"Failed to queue translation for event {event.id}: {str(e)}"
                )

        if queued_count > 0:
            self.message_user(
                request,
                f"Successfully queued translation tasks for {queued_count} event(s). "
                f"Translations will be processed in the background.",
            )

        if failed_count > 0:
            self.message_user(
                request,
                f"Failed to queue {failed_count} event(s) for translation.",
                level=messages.ERROR,
            )

        # If some events in the selection don't need translation
        skipped_count = queryset.count() - events_count
        if skipped_count > 0:
            self.message_user(
                request,
                f"Skipped {skipped_count} event(s) that already have complete translations.",
                level=messages.INFO,
            )

    translate_selected_events.short_description = "Translate selected events (AI)"


admin.site.site_header = "PWr Now Admin"
admin.site.site_title = "PWr Now Admin Portal"
admin.site.index_title = "Welcome to PWr Now Administration"


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "event",
        "event_category",
        "event_organization",
        "created_at",
    ]
    list_filter = ["created_at", "event__category", "event__organization"]
    search_fields = ["user__username", "user__email", "event__title", "event__slug"]
    autocomplete_fields = ["user", "event"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]

    @admin.display(description="Category", ordering="event__category__name")
    def event_category(self, obj):
        return obj.event.category.name if obj.event.category else "-"

    @admin.display(description="Organization", ordering="event__organization__name")
    def event_organization(self, obj):
        return obj.event.organization.name if obj.event.organization else "-"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("user", "event", "event__category", "event__organization")
        )


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0
    fields = ["image", "aspect_ratio", "order_index", "image_preview", "created_at"]
    readonly_fields = ["image_preview", "created_at"]

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit: cover;" />',
                obj.image.url,
            )
        return "-"


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = [
        "post",
        "image_preview",
        "aspect_ratio_display",
        "order_index",
        "event_name",
        "organization_name",
        "created_at",
    ]
    list_filter = [
        "created_at",
        "aspect_ratio",
        "post__event",
        "post__organization",
        HasAspectRatioFilter,
    ]
    search_fields = ["post__event__title", "post__organization__name", "post__text"]
    readonly_fields = ["id", "created_at", "image_preview", "aspect_ratio_display"]
    list_editable = ["order_index"]
    autocomplete_fields = ["post"]
    ordering = ["post", "order_index"]
    date_hierarchy = "created_at"

    @admin.display(description="Event", ordering="post__event__title")
    def event_name(self, obj):
        return obj.post.event.title if obj.post.event else "-"

    @admin.display(description="Organization", ordering="post__organization__name")
    def organization_name(self, obj):
        return obj.post.organization.name if obj.post.organization else "-"

    fieldsets = (
        ("Post Information", {"fields": ("post",)}),
        (
            "Image Details",
            {
                "fields": (
                    "image",
                    "image_preview",
                    "aspect_ratio",
                    "aspect_ratio_display",
                    "order_index",
                ),
                "description": "Upload an image and set its display order. Aspect ratio is automatically detected.",
            },
        ),
        ("Metadata", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Preview")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="80" height="80" style="object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return "No image"

    @admin.display(description="Aspect Ratio")
    def aspect_ratio_display(self, obj):
        if obj.aspect_ratio:
            return format_html(
                '<span style="background-color: #e8f5e8; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; color: #2e7d32;">{}</span>',
                obj.aspect_ratio,
            )
        return format_html(
            '<span style="color: #999; font-style: italic;">Auto-detect</span>'
        )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("post__event", "post__organization")
        )

    actions = ["detect_aspect_ratios"]

    def detect_aspect_ratios(self, request, queryset):
        """Trigger aspect ratio detection for selected post images."""
        queued_count = 0
        skipped_count = 0

        for post_image in queryset:
            if not post_image.image:
                skipped_count += 1
                continue

            # Trigger the aspect ratio detection task
            try:
                from .tasks import detect_post_image_aspect_ratio

                detect_post_image_aspect_ratio.delay(str(post_image.id))
                queued_count += 1
            except Exception as e:
                # Fallback to synchronous processing if Celery is unavailable
                try:
                    from .tasks import detect_post_image_aspect_ratio

                    detect_post_image_aspect_ratio(str(post_image.id))
                    queued_count += 1
                except Exception:
                    skipped_count += 1

        if queued_count:
            self.message_user(
                request,
                f"Aspect ratio detection queued for {queued_count} post images.",
            )
        if skipped_count:
            level = (
                messages.WARNING if skipped_count == queryset.count() else messages.INFO
            )
            self.message_user(
                request, f"Skipped {skipped_count} post images (no image).", level=level
            )

    detect_aspect_ratios.short_description = (
        "Detect aspect ratios for selected post images"
    )


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "organization",
        "text_preview",
        "images_count",
        "verified",
        "verified_at",
        "created_at",
        "updated_at",
    ]
    list_filter = [
        "verified",
        "event",
        "organization",
        "created_at",
        "updated_at",
        "verified_at",
    ]
    search_fields = ["event__title", "event__slug", "organization__name", "text"]
    readonly_fields = ["id", "created_at", "updated_at", "verified_at"]
    list_editable = ["verified"]
    inlines = [PostImageInline]
    autocomplete_fields = ["event", "organization"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]

    fieldsets = (
        ("Content", {"fields": ("event", "organization", "text")}),
        ("Verification", {"fields": ("verified", "verified_at")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Text")
    def text_preview(self, obj):
        if obj.text:
            return Truncator(obj.text).chars(60)
        return "-"

    @admin.display(description="Images")
    def images_count(self, obj):
        cnt = obj.images.count()
        url = reverse("admin:core_postimage_changelist") + f"?post__id__exact={obj.id}"
        return format_html('<a href="{}">{} images</a>', url, cnt)

    actions = ["detect_post_images_aspect_ratios", "send_post_notifications"]

    def send_post_notifications(self, request, queryset):
        """Manually trigger post notifications for selected posts."""
        from notifications.tasks import send_post_verification_notifications

        queued_count = 0
        skipped_count = 0

        for post in queryset:
            if not post.verified:
                skipped_count += 1
                continue

            try:
                # Trigger the notification task
                send_post_verification_notifications.delay(str(post.id))
                queued_count += 1
            except Exception as e:
                skipped_count += 1

        if queued_count:
            self.message_user(
                request, f"Post notifications queued for {queued_count} verified posts."
            )
        if skipped_count:
            level = (
                messages.WARNING if skipped_count == queryset.count() else messages.INFO
            )
            self.message_user(
                request, f"Skipped {skipped_count} posts (not verified).", level=level
            )

    send_post_notifications.short_description = (
        "Send post notifications to users who liked the event"
    )

    def detect_post_images_aspect_ratios(self, request, queryset):
        """Trigger aspect ratio detection for all images in selected posts."""
        queued_count = 0
        skipped_count = 0

        for post in queryset:
            post_images = post.images.filter(image__isnull=False)
            if not post_images.exists():
                skipped_count += 1
                continue

            for post_image in post_images:
                # Trigger the aspect ratio detection task
                try:
                    from .tasks import detect_post_image_aspect_ratio

                    detect_post_image_aspect_ratio.delay(str(post_image.id))
                    queued_count += 1
                except Exception as e:
                    # Fallback to synchronous processing if Celery is unavailable
                    try:
                        from .tasks import detect_post_image_aspect_ratio

                        detect_post_image_aspect_ratio(str(post_image.id))
                        queued_count += 1
                    except Exception:
                        pass

        if queued_count:
            self.message_user(
                request,
                f"Aspect ratio detection queued for {queued_count} post images across selected posts.",
            )
        if skipped_count:
            level = (
                messages.WARNING if skipped_count == queryset.count() else messages.INFO
            )
            self.message_user(
                request, f"Skipped {skipped_count} posts (no images).", level=level
            )

    detect_post_images_aspect_ratios.short_description = (
        "Detect aspect ratios for all images in selected posts"
    )


class ScheduleItemInline(admin.TabularInline):
    model = ScheduleItem
    extra = 1
    fields = ["date", "start_time", "end_time", "title", "description"]
    ordering = ["date", "start_time"]


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "items_count",
        "days_count",
        "event_category",
        "event_organization",
        "created_at",
        "updated_at",
    ]
    list_filter = ["created_at", "updated_at", "event__category", "event__organization"]
    search_fields = ["event__title", "event__slug"]
    autocomplete_fields = ["event"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ScheduleItemInline]
    date_hierarchy = "created_at"

    @admin.display(description="Category", ordering="event__category__name")
    def event_category(self, obj):
        return obj.event.category.name if obj.event.category else "-"

    @admin.display(description="Organization", ordering="event__organization__name")
    def event_organization(self, obj):
        return obj.event.organization.name if obj.event.organization else "-"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("event", "event__category", "event__organization")
        )

    @admin.display(description="Items")
    def items_count(self, obj):
        return obj.items.count()

    @admin.display(description="Days")
    def days_count(self, obj):
        return obj.items.values("date").distinct().count()


@admin.register(ScheduleItem)
class ScheduleItemAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "event_display",
        "date",
        "start_time",
        "end_time",
        "schedule",
    ]
    list_filter = [
        "date",
        "schedule__event",
        "schedule__event__category",
        "schedule__event__organization",
    ]
    search_fields = [
        "title",
        "description",
        "schedule__event__title",
        "schedule__event__slug",
    ]
    autocomplete_fields = ["schedule"]
    ordering = ["date", "start_time"]
    date_hierarchy = "date"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "schedule",
                "schedule__event",
                "schedule__event__category",
                "schedule__event__organization",
            )
        )

    @admin.display(description="Event", ordering="schedule__event__title")
    def event_display(self, obj):
        return obj.schedule.event


class EventCoHostInline(admin.TabularInline):
    model = EventCoHost
    extra = 1
    fields = ["organization", "created_at"]
    readonly_fields = ["created_at"]
    autocomplete_fields = ["organization"]
    verbose_name = "Co-Host Organization"
    verbose_name_plural = "Co-Host Organizations"


class QRCodeInline(admin.TabularInline):
    model = QRCode
    extra = 0
    fields = ["name", "code", "is_active", "usage_count", "last_used_at"]
    readonly_fields = ["usage_count", "last_used_at"]


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "name",
        "code",
        "is_active",
        "usage_count",
        "has_been_used",
        "last_used_display",
        "created_at",
        "qr_code_preview",
    ]
    list_filter = [
        "is_active",
        "event",
        "event__category",
        "event__organization",
        "created_at",
        "last_used_at",
    ]
    search_fields = ["event__title", "event__slug", "name", "code"]
    autocomplete_fields = ["event"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "usage_count",
        "last_used_at",
        "qr_code_preview",
        "has_been_used",
    ]
    list_editable = ["is_active"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    @admin.display(description="Used", boolean=True)
    def has_been_used(self, obj):
        return obj.last_used_at is not None

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("event", "event__category", "event__organization")
        )

    fieldsets = (
        ("Basic Information", {"fields": ("event", "name", "code")}),
        ("Status & Usage", {"fields": ("is_active", "usage_count", "last_used_at")}),
        (
            "QR Code",
            {
                "fields": ("qr_code_preview",),
                "description": "QR code image for this code",
            },
        ),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Last Used", ordering="last_used_at")
    def last_used_display(self, obj):
        if obj.last_used_at:
            from django.utils import timezone

            now = timezone.now()
            time_diff = now - obj.last_used_at

            if time_diff.days > 0:
                return format_html(
                    '<span title="{}">{} days ago</span>',
                    obj.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                    time_diff.days,
                )
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                return format_html(
                    '<span title="{}">{} hours ago</span>',
                    obj.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                    hours,
                )
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                return format_html(
                    '<span title="{}">{} minutes ago</span>',
                    obj.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                    minutes,
                )
            else:
                return format_html(
                    '<span title="{}">Just now</span>',
                    obj.last_used_at.strftime("%Y-%m-%d %H:%M:%S"),
                )
        else:
            return format_html('<span style="color: #999;">Never used</span>')

    @admin.display(description="QR Code")
    def qr_code_preview(self, obj):
        try:
            import qrcode
            from io import BytesIO
            from django.core.files.base import ContentFile
            from django.utils.html import format_html

            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(obj.code)
            qr.make(fit=True)

            # Create image
            img = qr.make_image(fill_color="black", back_color="white")

            # Convert to base64 for display
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            import base64

            img_str = base64.b64encode(buffer.getvalue()).decode()

            return format_html(
                '<img src="data:image/png;base64,{}" width="100" height="100" style="border: 1px solid #ddd;" />',
                img_str,
            )
        except ImportError:
            return format_html(
                '<span style="color: #999;">QR code library not installed</span>'
            )
        except Exception as e:
            return format_html('<span style="color: #dc3545;">Error: {}</span>', str(e))

    actions = ["generate_qr_codes", "activate_qr_codes", "deactivate_qr_codes"]

    def generate_qr_codes(self, request, queryset):
        """Generate QR code images for selected QR codes."""
        try:
            import qrcode
            from io import BytesIO
            from django.core.files.base import ContentFile

            generated_count = 0
            for qr_code in queryset:
                # Generate QR code
                qr = qrcode.QRCode(
                    version=1,
                    error_correction=qrcode.constants.ERROR_CORRECT_L,
                    box_size=10,
                    border=4,
                )
                qr.add_data(qr_code.code)
                qr.make(fit=True)

                # Create image
                img = qr.make_image(fill_color="black", back_color="white")

                # Save to file
                buffer = BytesIO()
                img.save(buffer, format="PNG")
                buffer.seek(0)

                # You could save this to a file or return it as a download
                # For now, we'll just mark as processed
                generated_count += 1

            self.message_user(
                request, f"Generated QR codes for {generated_count} items."
            )
        except ImportError:
            self.message_user(
                request,
                "QR code library not installed. Please install qrcode[pil].",
                level=messages.ERROR,
            )
        except Exception as e:
            self.message_user(
                request, f"Error generating QR codes: {str(e)}", level=messages.ERROR
            )

    generate_qr_codes.short_description = "Generate QR code images"

    def activate_qr_codes(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} QR codes activated.")

    activate_qr_codes.short_description = "Activate selected QR codes"

    def deactivate_qr_codes(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} QR codes deactivated.")

    deactivate_qr_codes.short_description = "Deactivate selected QR codes"


@admin.register(EventParticipation)
class EventParticipationAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "event",
        "event_category",
        "event_organization",
        "participation_type",
        "qr_code",
        "is_confirmed",
        "confirmed_at",
        "created_at",
    ]
    list_filter = [
        "participation_type",
        "confirmed_at",
        "created_at",
        "event",
        "event__category",
        "event__organization",
        "qr_code",
    ]
    search_fields = [
        "user__username",
        "user__email",
        "event__title",
        "event__slug",
        "qr_code__name",
        "notes",
    ]
    autocomplete_fields = ["user", "event", "qr_code"]
    readonly_fields = ["id", "created_at", "updated_at", "confirmed_at", "is_confirmed"]
    ordering = ["-confirmed_at", "-created_at"]
    date_hierarchy = "created_at"

    @admin.display(description="Confirmed", boolean=True)
    def is_confirmed(self, obj):
        return obj.confirmed_at is not None

    @admin.display(description="Category", ordering="event__category__name")
    def event_category(self, obj):
        return obj.event.category.name if obj.event.category else "-"

    @admin.display(description="Organization", ordering="event__organization__name")
    def event_organization(self, obj):
        return obj.event.organization.name if obj.event.organization else "-"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "user", "event", "event__category", "event__organization", "qr_code"
            )
        )

    fieldsets = (
        (
            "Participation Details",
            {"fields": ("user", "event", "participation_type", "qr_code")},
        ),
        ("Confirmation", {"fields": ("confirmed_at", "notes")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


# Add inlines to EventAdmin after they're defined
EventAdmin.inlines = [EventCoHostInline, QRCodeInline]


class EventMapInline(admin.StackedInline):
    model = EventMap
    extra = 0
    fields = ["title", "description", "is_active"]
    readonly_fields = ["id", "created_at", "updated_at", "locations_count"]


class EventMapLocationInline(admin.TabularInline):
    model = EventMapLocation
    extra = 0
    fields = [
        "name",
        "description",
        "latitude",
        "longitude",
        "address",
        "order_index",
        "image",
        "is_active",
    ]
    ordering = ["order_index"]


@admin.register(EventMap)
class EventMapAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "title",
        "locations_count",
        "is_active",
        "event_category",
        "event_organization",
        "created_at",
        "updated_at",
    ]
    list_filter = [
        "is_active",
        "created_at",
        "updated_at",
        "event__category",
        "event__organization",
    ]
    search_fields = ["event__title", "event__slug", "title", "description"]
    autocomplete_fields = ["event"]
    readonly_fields = ["id", "created_at", "updated_at", "locations_count"]
    list_editable = ["is_active"]
    inlines = [EventMapLocationInline]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    @admin.display(description="Category", ordering="event__category__name")
    def event_category(self, obj):
        return obj.event.category.name if obj.event.category else "-"

    @admin.display(description="Organization", ordering="event__organization__name")
    def event_organization(self, obj):
        return obj.event.organization.name if obj.event.organization else "-"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("event", "event__category", "event__organization")
        )

    fieldsets = (
        ("Basic Information", {"fields": ("event", "title", "description")}),
        ("Status", {"fields": ("is_active", "locations_count")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Locations")
    def locations_count(self, obj):
        count = obj.locations_count
        url = (
            reverse("admin:core_eventmaplocation_changelist")
            + f"?event_map__id__exact={obj.id}"
        )
        return format_html('<a href="{}">{} locations</a>', url, count)


@admin.register(EventMapLocation)
class EventMapLocationAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "event_map",
        "event_name",
        "address",
        "coordinates",
        "image_preview",
        "order_index",
        "is_active",
        "has_image",
        "created_at",
    ]
    list_filter = [
        "is_active",
        "event_map__event",
        "event_map__event__category",
        "event_map__event__organization",
        "created_at",
        HasImageFilter,
    ]
    search_fields = [
        "name",
        "description",
        "address",
        "event_map__event__title",
        "event_map__event__slug",
    ]
    autocomplete_fields = ["event_map"]
    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "coordinates",
        "image_preview",
        "has_image",
    ]
    list_editable = ["order_index", "is_active"]
    ordering = ["event_map", "order_index"]
    date_hierarchy = "created_at"

    @admin.display(description="Event", ordering="event_map__event__title")
    def event_name(self, obj):
        return obj.event_map.event.title if obj.event_map.event else "-"

    @admin.display(description="Has Image", boolean=True)
    def has_image(self, obj):
        return bool(obj.image)

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "event_map",
                "event_map__event",
                "event_map__event__category",
                "event_map__event__organization",
            )
        )

    fieldsets = (
        (
            "Location Information",
            {"fields": ("event_map", "name", "description", "address")},
        ),
        ("Coordinates", {"fields": ("latitude", "longitude", "coordinates")}),
        ("Display", {"fields": ("order_index", "is_active", "image", "image_preview")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Coordinates")
    def coordinates(self, obj):
        if obj.latitude and obj.longitude:
            lat = float(obj.latitude)
            lng = float(obj.longitude)
            coords_text = f"{lat:.6f}, {lng:.6f}"
            return format_html(
                '<span style="font-family: monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px;">{}</span>',
                coords_text,
            )
        return format_html('<span style="color: #999;">Not set</span>')

    @admin.display(description="Image Preview")
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="40" height="40" style="object-fit: cover; border-radius: 4px;" />',
                obj.image.url,
            )
        return format_html('<span style="color: #999;">No image</span>')

    actions = ["activate_locations", "deactivate_locations"]

    def activate_locations(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} locations activated.")

    activate_locations.short_description = "Activate selected locations"

    def deactivate_locations(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} locations deactivated.")

    deactivate_locations.short_description = "Deactivate selected locations"


# Add EventMapInline to EventAdmin after it's defined
EventAdmin.inlines.append(EventMapInline)


@admin.register(EventCoHost)
class EventCoHostAdmin(admin.ModelAdmin):
    list_display = [
        "event",
        "organization",
        "event_admin_org",
        "event_verified",
        "created_at",
    ]
    list_filter = [
        "created_at",
        "event__verified",
        "organization",
        "event__organization",
    ]
    search_fields = [
        "event__title",
        "event__slug",
        "organization__name",
        "event__organization__name",
    ]
    autocomplete_fields = ["event", "organization"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Co-Host Details", {"fields": ("event", "organization")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Admin Org", ordering="event__organization__name")
    def event_admin_org(self, obj):
        return obj.event.organization.name if obj.event.organization else "-"

    @admin.display(description="Verified", boolean=True, ordering="event__verified")
    def event_verified(self, obj):
        return obj.event.verified

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("event", "event__organization", "organization")
        )


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ["user1", "user2", "created_at"]
    list_filter = ["created_at"]
    search_fields = [
        "user1__username",
        "user1__email",
        "user2__username",
        "user2__email",
    ]
    autocomplete_fields = ["user1", "user2"]
    readonly_fields = ["id", "created_at"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Friendship", {"fields": ("user1", "user2")}),
        ("Metadata", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user1", "user2")


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ["from_user", "to_user", "status", "created_at", "updated_at"]
    list_filter = ["status", "created_at", "updated_at"]
    search_fields = [
        "from_user__username",
        "from_user__email",
        "to_user__username",
        "to_user__email",
    ]
    autocomplete_fields = ["from_user", "to_user"]
    readonly_fields = ["id", "created_at", "updated_at"]
    list_editable = ["status"]
    ordering = ["-created_at"]
    date_hierarchy = "created_at"

    fieldsets = (
        ("Friend Request", {"fields": ("from_user", "to_user", "status")}),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("from_user", "to_user")
