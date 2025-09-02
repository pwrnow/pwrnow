from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.text import Truncator
from django.conf import settings
from django.utils import timezone
from modeltranslation.admin import TranslationAdmin, TranslationTabularInline, TranslationStackedInline
from .models import Event, Category, Organization, Tag, OrganizationCode, Like, Post, PostImage, Schedule, ScheduleItem
from .forms import OrganizationAdminForm, EventAdminForm


@admin.register(Category)
class CategoryAdmin(TranslationAdmin):
    list_display = ['name', 'slug', 'order_index', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order_index']
    ordering = ['order_index', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    # Translation-specific configurations - let TranslationAdmin handle fieldsets automatically
    # This will create tabs/sections for Polish and English translations
    group_fieldsets = True

    @admin.display(description='Events')
    def event_count(self, obj):
        count = obj.events.count()
        url = reverse('admin:core_event_changelist') + f'?category__id__exact={obj.id}'
        return format_html('<a href="{}">{} events</a>', url, count)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    @admin.display(description='Events')
    def event_count(self, obj):
        count = obj.events.count()
        return f"{count} events"


class OrganizationCodeInline(admin.TabularInline):
    model = OrganizationCode
    extra = 0
    readonly_fields = ['code', 'created_at', 'last_used_at']
    fields = ['code', 'created_at', 'last_used_at']


@admin.register(OrganizationCode)
class OrganizationCodeAdmin(admin.ModelAdmin):
    list_display = ['organization', 'code_preview', 'created_at', 'last_used_display']
    list_filter = ['created_at', 'last_used_at']
    search_fields = ['organization__name', 'code']
    autocomplete_fields = ['organization']
    readonly_fields = ['id','created_at', 'updated_at', 'last_used_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Organization', {
            'fields': ('organization',)
        }),
        ('Authentication Details', {
            'fields': ('code',)
        }),
        ('Usage Statistics', {
            'fields': ('last_used_at',),
            'description': 'Track when this organization code was last used for authentication'
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Code')
    def code_preview(self, obj):
        if settings.DEBUG:
            base_url = "http://localhost:3000"
        else:
            base_url = "https://pwrnow.pl"

        url = f"{base_url}/auth/{obj.code}"
        return format_html('<a href="{}" target="_blank">{}</a>', url, obj.code)

    @admin.display(description='Last Used', ordering='last_used_at')
    def last_used_display(self, obj):
        if obj.last_used_at:
            from django.utils import timezone
            now = timezone.now()
            time_diff = now - obj.last_used_at

            if time_diff.days > 0:
                return format_html(
                    '<span title="{}">{} days ago</span>',
                    obj.last_used_at.strftime('%Y-%m-%d %H:%M:%S'),
                    time_diff.days
                )
            elif time_diff.seconds > 3600:
                hours = time_diff.seconds // 3600
                return format_html(
                    '<span title="{}">{} hours ago</span>',
                    obj.last_used_at.strftime('%Y-%m-%d %H:%M:%S'),
                    hours
                )
            elif time_diff.seconds > 60:
                minutes = time_diff.seconds // 60
                return format_html(
                    '<span title="{}">{} minutes ago</span>',
                    obj.last_used_at.strftime('%Y-%m-%d %H:%M:%S'),
                    minutes
                )
            else:
                return format_html(
                    '<span title="{}">Just now</span>',
                    obj.last_used_at.strftime('%Y-%m-%d %H:%M:%S')
                )
        else:
            return format_html('<span style="color: #999;">Never used</span>')


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    form = OrganizationAdminForm
    list_display = ['name', 'slug', 'image_preview', 'auth_codes_count', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [OrganizationCodeInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'image'),
            'description': 'You can paste images directly from your clipboard in the image field below.'
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Image')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="30" height="30" style="object-fit: cover;" />', obj.image.url)
        return "No image"

    @admin.display(description='Auth Codes')
    def auth_codes_count(self, obj):
        count = obj.auth_codes.count()
        url = reverse('admin:core_organizationcode_changelist') + f'?organization__id__exact={obj.id}'
        return format_html('<a href="{}">{} codes</a>', url, count)

    @admin.display(description='Events')
    def event_count(self, obj):
        count = obj.events.count()
        url = reverse('admin:core_event_changelist') + f'?organization__id__exact={obj.id}'
        return format_html('<a href="{}">{} events</a>', url, count)


@admin.register(Event)
class EventAdmin(TranslationAdmin):
    form = EventAdminForm
    list_display = [
        'truncated_title',
        'image_preview',
        'starts_at',
        'ends_at',
        'publication_date',
        'category',
        'organization',
        'verified',
        'status_display',
        'likes_count_display'
    ]
    list_filter = [
        'verified',
        'category',
        'organization',
        'starts_at',
        'created_at',
        'publication_date'
    ]
    search_fields = ['title', 'description', 'location', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['verified']
    date_hierarchy = 'starts_at'
    ordering = ['starts_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'duration_display', 'verified_at', 'likes_count_display']
    autocomplete_fields = ['category', 'organization']
    filter_horizontal = ['tags']

    # Translation-specific configurations
    group_fieldsets = True

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category')
        }),
        ('Timing', {
            'fields': ('starts_at', 'ends_at', 'publication_date', 'duration_display')
        }),
        ('Location & Links', {
            'fields': ('location', 'url', 'image', 'aspect_ratio')
        }),
        ('Organization & Tags', {
            'fields': ('organization', 'tags')
        }),
        ('Status', {
            'fields': ('verified', 'verified_at')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Title')
    def truncated_title(self, obj):
        return Truncator(obj.title).chars(50)

    @admin.display(description='Image')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit: cover;" />', obj.image.url)
        return "No image"

    @admin.display(description='Aspect Ratio')
    def aspect_ratio_display(self, obj):
        if obj.aspect_ratio:
            # Add some styling to make it stand out
            return format_html(
                '<span style="background-color: #e3f2fd; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
                obj.aspect_ratio
            )
        return format_html('<span style="color: #999; font-style: italic;">Not set</span>')

    @admin.display(description='Status')
    def status_display(self, obj):
        if obj.is_past:
            color = '#dc3545'  # red
            status = 'Past'
        elif obj.is_ongoing:
            color = '#28a745'  # green
            status = 'Ongoing'
        else:
            color = '#007bff'  # blue
            status = 'Upcoming'

        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, status
        )

    @admin.display(description='Duration')
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

    @admin.display(description='Likes')
    def likes_count_display(self, obj):
        count = obj.likes_count
        return format_html('<span style="color: #10b981;">❤️ {}</span>', count)
    likes_count_display.short_description = 'Likes'

    # Removed schedule_manage_link from Event admin per request

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'category', 'organization'
        ).prefetch_related('tags')

    actions = ['mark_as_verified', 'mark_as_unverified', 'detect_aspect_ratios', 'send_event_publication_notifications']

    def mark_as_verified(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f'{updated} events marked as verified.')
    mark_as_verified.short_description = "Mark selected events as verified"

    def mark_as_unverified(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f'{updated} events marked as unverified.')
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
            self.message_user(request, f'Aspect ratio detection queued for {queued_count} events.')
        if skipped_count:
            level = messages.WARNING if skipped_count == queryset.count() else messages.INFO
            self.message_user(request, f'Skipped {skipped_count} events (no image).', level=level)
    detect_aspect_ratios.short_description = "Detect aspect ratios for selected events"

    def send_event_publication_notifications(self, request, queryset):
        """Send publication notifications for selected events regardless of publication date."""
        # Filter only verified events
        verified_events = queryset.filter(verified=True)
        if not verified_events.exists():
            self.message_user(
                request,
                'No verified events selected. Please select verified events only.',
                level=messages.WARNING
            )
            return

        try:
            from notifications.services import push_service
            result = push_service.send_publication_notifications_for_events(verified_events)

            if result['sent'] > 0:
                self.message_user(
                    request,
                    f'Successfully sent publication notifications for {len(verified_events)} events: {result["sent"]} sent, {result["failed"]} failed.'
                )
            else:
                self.message_user(
                    request,
                    f'Failed to send publication notifications: {result["failed"]} failed.',
                    level=messages.ERROR
                )
        except Exception as e:
            self.message_user(
                request,
                f'Error sending publication notifications: {str(e)}',
                level=messages.ERROR
            )
    send_event_publication_notifications.short_description = "Send event publication notifications"


admin.site.site_header = "PWr Now Admin"
admin.site.site_title = "PWr Now Admin Portal"
admin.site.index_title = "Welcome to PWr Now Administration"


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__email', 'event__title']
    autocomplete_fields = ['user', 'event']


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0
    fields = ['image', 'aspect_ratio', 'order_index', 'image_preview', 'created_at']
    readonly_fields = ['image_preview', 'created_at']

    @admin.display(description='Preview')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="60" height="60" style="object-fit: cover;" />', obj.image.url)
        return "-"


@admin.register(PostImage)
class PostImageAdmin(admin.ModelAdmin):
    list_display = ['post', 'image_preview', 'aspect_ratio_display', 'order_index', 'created_at']
    list_filter = ['created_at', 'post__event', 'post__organization']
    search_fields = ['post__event__title', 'post__organization__name']
    readonly_fields = ['id', 'created_at', 'image_preview', 'aspect_ratio_display']
    list_editable = ['order_index']
    autocomplete_fields = ['post']
    ordering = ['post', 'order_index']

    fieldsets = (
        ('Post Information', {
            'fields': ('post',)
        }),
        ('Image Details', {
            'fields': ('image', 'image_preview', 'aspect_ratio', 'aspect_ratio_display', 'order_index'),
            'description': 'Upload an image and set its display order. Aspect ratio is automatically detected.'
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Preview')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="80" height="80" style="object-fit: cover; border-radius: 4px;" />', obj.image.url)
        return "No image"

    @admin.display(description='Aspect Ratio')
    def aspect_ratio_display(self, obj):
        if obj.aspect_ratio:
            return format_html(
                '<span style="background-color: #e8f5e8; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold; color: #2e7d32;">{}</span>',
                obj.aspect_ratio
            )
        return format_html('<span style="color: #999; font-style: italic;">Auto-detect</span>')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'post__event', 'post__organization'
        )

    actions = ['detect_aspect_ratios']

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
            self.message_user(request, f'Aspect ratio detection queued for {queued_count} post images.')
        if skipped_count:
            level = messages.WARNING if skipped_count == queryset.count() else messages.INFO
            self.message_user(request, f'Skipped {skipped_count} post images (no image).', level=level)
    detect_aspect_ratios.short_description = "Detect aspect ratios for selected post images"


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['event', 'organization', 'text_preview', 'images_count', 'verified', 'created_at']
    list_filter = ['verified', 'event', 'organization', 'created_at']
    search_fields = ['event__title', 'organization__name', 'text']
    readonly_fields = ['id', 'created_at', 'updated_at', 'verified_at']
    list_editable = ['verified']
    inlines = [PostImageInline]
    autocomplete_fields = ['event', 'organization']

    fieldsets = (
        ('Content', {
            'fields': ('event', 'organization', 'text')
        }),
        ('Verification', {
            'fields': ('verified', 'verified_at')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Text')
    def text_preview(self, obj):
        if obj.text:
            return Truncator(obj.text).chars(60)
        return "-"

    @admin.display(description='Images')
    def images_count(self, obj):
        cnt = obj.images.count()
        url = reverse('admin:core_postimage_changelist') + f'?post__id__exact={obj.id}'
        return format_html('<a href="{}">{} images</a>', url, cnt)

    actions = ['detect_post_images_aspect_ratios', 'send_post_notifications']

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
            self.message_user(request, f'Post notifications queued for {queued_count} verified posts.')
        if skipped_count:
            level = messages.WARNING if skipped_count == queryset.count() else messages.INFO
            self.message_user(request, f'Skipped {skipped_count} posts (not verified).', level=level)
    send_post_notifications.short_description = "Send post notifications to users who liked the event"

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
            self.message_user(request, f'Aspect ratio detection queued for {queued_count} post images across selected posts.')
        if skipped_count:
            level = messages.WARNING if skipped_count == queryset.count() else messages.INFO
            self.message_user(request, f'Skipped {skipped_count} posts (no images).', level=level)
    detect_post_images_aspect_ratios.short_description = "Detect aspect ratios for all images in selected posts"


class ScheduleItemInline(admin.TabularInline):
    model = ScheduleItem
    extra = 1
    fields = ['date', 'start_time', 'end_time', 'title', 'description']
    ordering = ['date', 'start_time']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['event', 'items_count', 'days_count', 'updated_at']
    search_fields = ['event__title', 'event__slug']
    autocomplete_fields = ['event']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [ScheduleItemInline]

    @admin.display(description='Items')
    def items_count(self, obj):
        return obj.items.count()

    @admin.display(description='Days')
    def days_count(self, obj):
        return obj.items.values('date').distinct().count()



@admin.register(ScheduleItem)
class ScheduleItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_display', 'date', 'start_time', 'end_time']
    list_filter = ['date']
    search_fields = ['title', 'description', 'schedule__event__title']
    autocomplete_fields = ['schedule']
    ordering = ['date', 'start_time']

    @admin.display(description='Event', ordering='schedule__event__title')
    def event_display(self, obj):
        return obj.schedule.event
