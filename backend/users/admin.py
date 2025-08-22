from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.db.models import Count
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""
    
    list_display = [
        'email',
        'get_full_name',
        'auth_provider_display',
        'google_verification_status',
        'is_staff',
        'is_superuser',
        'is_active',
        'login_status',
        'date_joined'
    ]
    
    list_filter = [
        'auth_provider',
        'is_google_verified',
        'is_staff',
        'is_superuser',
        'is_active',
        'date_joined',
        'last_login'
    ]
    
    search_fields = ['email', 'first_name', 'last_name', 'google_email']
    ordering = ['-date_joined']
    readonly_fields = ['id', 'date_joined', 'last_login', 'login_status', 'google_id', 'google_email']
    
    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name')
        }),
        ('Google OAuth', {
            'fields': ('auth_provider', 'google_id', 'google_email', 'profile_picture_url', 'is_google_verified'),
            'description': 'Google OAuth authentication information'
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('wide',)
        }),
        ('Activity', {
            'fields': ('last_login', 'login_status', 'date_joined'),
            'description': 'User activity and registration information'
        }),
        ('System', {
            'fields': ('id',),
            'classes': ('collapse',)
        })
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
        ('Personal Information', {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name'),
        }),
        ('Permissions', {
            'classes': ('wide',),
            'fields': ('is_staff', 'is_superuser'),
        }),
    )
    
    @admin.display(description='Full Name', ordering='first_name')
    def get_full_name(self, obj):
        """Display user's full name or fallback to email."""
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        if full_name:
            return full_name
        return format_html('<em>{}</em>', 'No name provided')
    
    @admin.display(description='Login Status', ordering='last_login')
    def login_status(self, obj):
        """Display user's login status with visual indicators."""
        if not obj.last_login:
            return format_html(
                '<span style="color: #999; font-style: italic;">Never logged in</span>'
            )
        
        now = timezone.now()
        time_since_login = now - obj.last_login
        
        if time_since_login.days > 30:
            color = '#dc3545'  # red
            status = f'{time_since_login.days} days ago'
        elif time_since_login.days > 7:
            color = '#fd7e14'  # orange
            status = f'{time_since_login.days} days ago'
        elif time_since_login.days > 0:
            color = '#20c997'  # teal
            status = f'{time_since_login.days} days ago'
        else:
            hours = time_since_login.seconds // 3600
            if hours > 0:
                color = '#28a745'  # green
                status = f'{hours} hours ago'
            else:
                color = '#28a745'  # green
                status = 'Recently'
        
        return format_html(
            '<span style="color: {};" title="Last login: {}">{}</span>',
            color,
            obj.last_login.strftime('%Y-%m-%d %H:%M:%S'),
            status
        )
    
    def get_queryset(self, request):
        """Optimize queryset with prefetch_related for groups."""
        return super().get_queryset(request).prefetch_related('groups')
    
    actions = ['activate_users', 'deactivate_users', 'make_staff', 'remove_staff']
    
    def activate_users(self, request, queryset):
        """Activate selected users."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users activated.')
    activate_users.short_description = "Activate selected users"
    
    @admin.display(description='Auth Provider', ordering='auth_provider')
    def auth_provider_display(self, obj):
        """Display authentication provider with styling."""
        if obj.auth_provider == 'google':
            color = '#4285f4'  # Google blue
            icon = '🔗'
        else:
            color = '#6c757d'  # Gray
            icon = '📧'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {}</span>',
            color,
            icon,
            obj.get_auth_provider_display()
        )
    
    @admin.display(description='Google Status', boolean=True)
    def google_verification_status(self, obj):
        """Display Google verification status."""
        if obj.auth_provider == 'google':
            return obj.is_google_verified
        return None
    
    @admin.display(description='Profile Picture')
    def profile_picture_display(self, obj):
        """Display profile picture if available."""
        if obj.profile_picture_url:
            return format_html(
                '<img src="{}" style="width: 32px; height: 32px; border-radius: 50%;" />',
                obj.profile_picture_url
            )
        return '-'
    
    def get_readonly_fields(self, request, obj=None):
        """Make certain fields readonly based on authentication provider."""
        readonly = list(self.readonly_fields)
        
        if obj and obj.auth_provider == 'google':
            # Make password field readonly for Google users
            readonly.extend(['password'])
        
        return readonly
    
    def deactivate_users(self, request, queryset):
        """Deactivate selected users."""
        updated = queryset.filter(is_superuser=False).update(is_active=False)
        if updated < queryset.count():
            self.message_user(
                request, 
                f'{updated} users deactivated. Superusers cannot be deactivated.',
                level='warning'
            )
        else:
            self.message_user(request, f'{updated} users deactivated.')
    deactivate_users.short_description = "Deactivate selected users"
    
    def make_staff(self, request, queryset):
        """Give staff status to selected users."""
        updated = queryset.update(is_staff=True)
        self.message_user(request, f'{updated} users given staff status.')
    make_staff.short_description = "Give staff status to selected users"
    
    def remove_staff(self, request, queryset):
        """Remove staff status from selected users."""
        updated = queryset.filter(is_superuser=False).update(is_staff=False)
        if updated < queryset.count():
            self.message_user(
                request,
                f'{updated} users had staff status removed. Superusers retain staff status.',
                level='warning'
            )
        else:
            self.message_user(request, f'{updated} users had staff status removed.')
    remove_staff.short_description = "Remove staff status from selected users"
