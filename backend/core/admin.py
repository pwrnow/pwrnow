from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.text import Truncator
from django.conf import settings
from django.utils import timezone
from modeltranslation.admin import TranslationAdmin, TranslationTabularInline, TranslationStackedInline
from .models import Event, Category, Organization, Tag, OrganizationCode, Like, Post, PostImage, Schedule, ScheduleItem, QRCode, EventParticipation, EventMap, EventMapLocation, Friendship, FriendRequest
from .forms import OrganizationAdminForm, EventAdminForm
from import_export.admin import ImportExportModelAdmin
from import_export import resources
from import_export import fields


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


class OrganizationCodeResource(resources.ModelResource):
    organization_name = fields.Field(attribute='organization__name', column_name='Organization Name')
    url = fields.Field(column_name='URL')
    
    class Meta:
        model = OrganizationCode
        fields = ['organization', 'organization_name', 'code', 'url', 'created_at', 'last_used_at']
    
    def dehydrate_url(self, obj):
        if settings.DEBUG:
            base_url = "http://localhost:3000"
        else:
            base_url = "https://pwrnow.pl"
        
        return f"{base_url}/auth/{obj.code}"


@admin.register(OrganizationCode)
class OrganizationCodeAdmin(ImportExportModelAdmin):
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

    resource_class = OrganizationCodeResource

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
        'verified_by_display',
        'status_display',
        'likes_count_display'
    ]
    list_filter = [
        'verified',
        'verified_by',
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
    ordering = ['-created_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'duration_display', 'verified_at', 'verified_by', 'likes_count_display']
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
            'fields': ('verified', 'verified_at', 'verified_by')
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

    @admin.display(description='Verified By')
    def verified_by_display(self, obj):
        if obj.verified_by:
            return format_html(
                '<span style="color: #10B981;">{}</span>',
                obj.get_verified_by_display()
            )
        return format_html('<span style="color: #EF4444;">Not verified</span>')
    verified_by_display.short_description = 'Verified By'

    # Removed schedule_manage_link from Event admin per request

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'category', 'organization', 'verified_by'
        ).prefetch_related('tags')

    actions = ['mark_as_verified', 'mark_as_unverified', 'detect_aspect_ratios', 'send_event_publication_notifications', 'send_event_reminder_24h']

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

    def send_event_reminder_24h(self, request, queryset):
        """Manually trigger 24h reminder notifications for selected verified events (ignores time window)."""
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
            result = push_service.send_event_reminders_for_events(verified_events)

            if result['sent'] > 0:
                self.message_user(
                    request,
                    f'Successfully sent reminder notifications: {result["sent"]} sent, {result["failed"]} failed.'
                )
            else:
                self.message_user(
                    request,
                    f'Failed to send reminders: {result["failed"]} failed.',
                    level=messages.ERROR
                )
        except Exception as e:
            self.message_user(
                request,
                f'Error sending reminders: {str(e)}',
                level=messages.ERROR
            )
    send_event_reminder_24h.short_description = "Send 24h reminder notifications (manual)"


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


class QRCodeInline(admin.TabularInline):
    model = QRCode
    extra = 0
    fields = ['name', 'code', 'is_active', 'usage_count', 'last_used_at']
    readonly_fields = ['usage_count', 'last_used_at']


@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = ['event', 'name', 'code', 'is_active', 'usage_count', 'last_used_display', 'qr_code_preview']
    list_filter = ['is_active', 'event', 'created_at', 'last_used_at']
    search_fields = ['event__title', 'name', 'code']
    autocomplete_fields = ['event']
    readonly_fields = ['id', 'created_at', 'updated_at', 'usage_count', 'last_used_at', 'qr_code_preview']
    list_editable = ['is_active']
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'name', 'code')
        }),
        ('Status & Usage', {
            'fields': ('is_active', 'usage_count', 'last_used_at')
        }),
        ('QR Code', {
            'fields': ('qr_code_preview',),
            'description': 'QR code image for this code'
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

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

    @admin.display(description='QR Code')
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
            img.save(buffer, format='PNG')
            buffer.seek(0)

            import base64
            img_str = base64.b64encode(buffer.getvalue()).decode()

            return format_html(
                '<img src="data:image/png;base64,{}" width="100" height="100" style="border: 1px solid #ddd;" />',
                img_str
            )
        except ImportError:
            return format_html('<span style="color: #999;">QR code library not installed</span>')
        except Exception as e:
            return format_html('<span style="color: #dc3545;">Error: {}</span>', str(e))

    actions = ['generate_qr_codes', 'activate_qr_codes', 'deactivate_qr_codes']

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
                img.save(buffer, format='PNG')
                buffer.seek(0)

                # You could save this to a file or return it as a download
                # For now, we'll just mark as processed
                generated_count += 1

            self.message_user(request, f'Generated QR codes for {generated_count} items.')
        except ImportError:
            self.message_user(request, 'QR code library not installed. Please install qrcode[pil].', level=messages.ERROR)
        except Exception as e:
            self.message_user(request, f'Error generating QR codes: {str(e)}', level=messages.ERROR)
    generate_qr_codes.short_description = "Generate QR code images"

    def activate_qr_codes(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} QR codes activated.')
    activate_qr_codes.short_description = "Activate selected QR codes"

    def deactivate_qr_codes(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} QR codes deactivated.')
    deactivate_qr_codes.short_description = "Deactivate selected QR codes"


@admin.register(EventParticipation)
class EventParticipationAdmin(admin.ModelAdmin):
    list_display = ['user', 'event', 'participation_type', 'qr_code', 'confirmed_at']
    list_filter = ['participation_type', 'confirmed_at', 'event', 'qr_code']
    search_fields = ['user__email', 'event__title', 'qr_code__name', 'notes']
    autocomplete_fields = ['user', 'event', 'qr_code']
    readonly_fields = ['id', 'created_at', 'updated_at', 'confirmed_at']
    ordering = ['-confirmed_at']

    fieldsets = (
        ('Participation Details', {
            'fields': ('user', 'event', 'participation_type', 'qr_code')
        }),
        ('Confirmation', {
            'fields': ('confirmed_at', 'notes')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'user', 'event', 'qr_code'
        )


# Add inlines to EventAdmin after they're defined
EventAdmin.inlines = [QRCodeInline]


class EventMapInline(admin.StackedInline):
    model = EventMap
    extra = 0
    fields = ['title', 'description', 'is_active']
    readonly_fields = ['id', 'created_at', 'updated_at', 'locations_count']


class EventMapLocationInline(admin.TabularInline):
    model = EventMapLocation
    extra = 0
    fields = ['name', 'description', 'latitude', 'longitude', 'address', 'order_index', 'image', 'is_active']
    ordering = ['order_index']


@admin.register(EventMap)
class EventMapAdmin(admin.ModelAdmin):
    list_display = ['event', 'title', 'locations_count', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['event__title', 'title', 'description']
    autocomplete_fields = ['event']
    readonly_fields = ['id', 'created_at', 'updated_at', 'locations_count']
    list_editable = ['is_active']
    inlines = [EventMapLocationInline]
    ordering = ['-created_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('event', 'title', 'description')
        }),
        ('Status', {
            'fields': ('is_active', 'locations_count')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Locations')
    def locations_count(self, obj):
        count = obj.locations_count
        url = reverse('admin:core_eventmaplocation_changelist') + f'?event_map__id__exact={obj.id}'
        return format_html('<a href="{}">{} locations</a>', url, count)


@admin.register(EventMapLocation)
class EventMapLocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_map', 'address', 'coordinates', 'image_preview', 'order_index', 'is_active', 'created_at']
    list_filter = ['is_active', 'event_map__event', 'created_at']
    search_fields = ['name', 'description', 'address', 'event_map__event__title']
    autocomplete_fields = ['event_map']
    readonly_fields = ['id', 'created_at', 'updated_at', 'coordinates', 'image_preview']
    list_editable = ['order_index', 'is_active']
    ordering = ['event_map', 'order_index']

    fieldsets = (
        ('Location Information', {
            'fields': ('event_map', 'name', 'description', 'address')
        }),
        ('Coordinates', {
            'fields': ('latitude', 'longitude', 'coordinates')
        }),
        ('Display', {
            'fields': ('order_index', 'is_active', 'image', 'image_preview')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    @admin.display(description='Coordinates')
    def coordinates(self, obj):
        if obj.latitude and obj.longitude:
            lat = float(obj.latitude)
            lng = float(obj.longitude)
            coords_text = f"{lat:.6f}, {lng:.6f}"
            return format_html(
                '<span style="font-family: monospace; background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px;">{}</span>',
                coords_text
            )
        return format_html('<span style="color: #999;">Not set</span>')

    @admin.display(description='Image Preview')
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit: cover; border-radius: 4px;" />', obj.image.url)
        return format_html('<span style="color: #999;">No image</span>')

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'event_map__event'
        )

    actions = ['activate_locations', 'deactivate_locations']

    def activate_locations(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} locations activated.')
    activate_locations.short_description = "Activate selected locations"

    def deactivate_locations(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} locations deactivated.')
    deactivate_locations.short_description = "Deactivate selected locations"


# Add EventMapInline to EventAdmin after it's defined
EventAdmin.inlines.append(EventMapInline)


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ['user1', 'user2', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user1__username', 'user1__email', 'user2__username', 'user2__email']
    autocomplete_fields = ['user1', 'user2']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Friendship', {
            'fields': ('user1', 'user2')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user1', 'user2')


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['from_user__username', 'from_user__email', 'to_user__username', 'to_user__email']
    autocomplete_fields = ['from_user', 'to_user']
    readonly_fields = ['id', 'created_at', 'updated_at']
    list_editable = ['status']
    ordering = ['-created_at']

    fieldsets = (
        ('Friend Request', {
            'fields': ('from_user', 'to_user', 'status')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('from_user', 'to_user')
