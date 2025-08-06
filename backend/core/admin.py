from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.text import Truncator
from django.conf import settings
from modeltranslation.admin import TranslationAdmin, TranslationTabularInline, TranslationStackedInline
from .models import Event, Category, Organization, Tag, OrganizationCode
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
        'category',
        'organization',
        'verified',
        'status_display'
    ]
    list_filter = [
        'verified',
        'category',
        'organization',
        'starts_at',
        'created_at'
    ]
    search_fields = ['title', 'description', 'location', 'slug']
    prepopulated_fields = {'slug': ('title',)}
    list_editable = ['verified']
    date_hierarchy = 'starts_at'
    ordering = ['starts_at']
    readonly_fields = ['id', 'created_at', 'updated_at', 'duration_display', 'verified_at']
    autocomplete_fields = ['category', 'organization']
    filter_horizontal = ['tags']

    # Translation-specific configurations
    group_fieldsets = True

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category')
        }),
        ('Timing', {
            'fields': ('starts_at', 'ends_at', 'duration_display')
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
            return f"{int(hours)}h {int(minutes)}m"
        return "-"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'category', 'organization'
        ).prefetch_related('tags')

    actions = ['mark_as_verified', 'mark_as_unverified']

    def mark_as_verified(self, request, queryset):
        updated = queryset.update(verified=True)
        self.message_user(request, f'{updated} events marked as verified.')
    mark_as_verified.short_description = "Mark selected events as verified"

    def mark_as_unverified(self, request, queryset):
        updated = queryset.update(verified=False)
        self.message_user(request, f'{updated} events marked as unverified.')
    mark_as_unverified.short_description = "Mark selected events as unverified"


admin.site.site_header = "PWr Now Admin"
admin.site.site_title = "PWr Now Admin Portal"
admin.site.index_title = "Welcome to PWr Now Administration"
