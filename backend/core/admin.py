from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils.text import Truncator
from .models import Event, Category, Organization, Tag, OrganizationCode


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order_index', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order_index']
    ordering = ['order_index', 'name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def event_count(self, obj):
        count = obj.events.count()
        url = reverse('admin:core_event_changelist') + f'?category__id__exact={obj.id}'
        return format_html('<a href="{}">{} events</a>', url, count)
    event_count.short_description = 'Events'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def event_count(self, obj):
        count = obj.events.count()
        return f"{count} events"
    event_count.short_description = 'Events'


class OrganizationCodeInline(admin.TabularInline):
    model = OrganizationCode
    extra = 0
    readonly_fields = ['code', 'created_at']
    fields = ['code', 'created_at']


@admin.register(OrganizationCode)
class OrganizationCodeAdmin(admin.ModelAdmin):
    list_display = ['organization', 'code_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['organization__name', 'code']
    autocomplete_fields = ['organization']
    readonly_fields = ['id','created_at', 'updated_at']
    ordering = ['-created_at']

    fieldsets = (
        ('Organization', {
            'fields': ('organization',)
        }),
        ('Authentication Details', {
            'fields': ('code',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def code_preview(self, obj):
        url = f"/{obj.code}"
        return format_html('<a href="{}" target="_blank">{}</a>', url, obj.code)
    code_preview.short_description = 'Code'


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'image_preview', 'auth_codes_count', 'event_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [OrganizationCodeInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'image')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="30" height="30" style="object-fit: cover;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Image'

    def auth_codes_count(self, obj):
        count = obj.auth_codes.count()
        url = reverse('admin:core_organizationcode_changelist') + f'?organization__id__exact={obj.id}'
        return format_html('<a href="{}">{} codes</a>', url, count)
    auth_codes_count.short_description = 'Auth Codes'

    def event_count(self, obj):
        count = obj.events.count()
        url = reverse('admin:core_event_changelist') + f'?organization__id__exact={obj.id}'
        return format_html('<a href="{}">{} events</a>', url, count)
    event_count.short_description = 'Events'


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
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

    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'category')
        }),
        ('Timing', {
            'fields': ('starts_at', 'ends_at', 'duration_display')
        }),
        ('Location & Links', {
            'fields': ('location', 'url', 'image')
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

    def truncated_title(self, obj):
        return Truncator(obj.title).chars(50)
    truncated_title.short_description = 'Title'

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="40" height="40" style="object-fit: cover;" />', obj.image.url)
        return "No image"
    image_preview.short_description = 'Image'

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
    status_display.short_description = 'Status'

    def duration_display(self, obj):
        if obj.starts_at and obj.ends_at:
            duration = obj.duration
            hours = duration.total_seconds() // 3600
            minutes = (duration.total_seconds() % 3600) // 60
            return f"{int(hours)}h {int(minutes)}m"
        return "-"
    duration_display.short_description = 'Duration'

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
