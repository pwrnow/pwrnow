from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone
from django.db.models import Count
from django.core.files.base import ContentFile
from django.utils.translation import gettext_lazy as _
from django import forms
from .models import User, ProfileImageChangeRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin interface for User model."""

    list_display = [
        'username',
        'email',
        'get_full_name',
        'is_staff',
        'is_superuser',
        'is_active',
        'username_set_by_user',
        'login_status',
        'date_joined',
        'last_login'
    ]

    list_filter = [
        'is_staff',
        'is_superuser',
        'is_active',
        'username_set_by_user',
        'date_joined',
        'last_login',
        'groups'
    ]

    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    readonly_fields = ['id', 'date_joined', 'last_login', 'login_status']
    date_hierarchy = 'date_joined'

    fieldsets = (
        ('Authentication', {
            'fields': ('email', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'username', 'username_set_by_user', 'profile_image')
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
            'fields': ('first_name', 'last_name', 'username'),
            'description': 'Username will be auto-generated if not provided'
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


class RejectProfileImageForm(forms.Form):
    """Form for rejecting a profile image with feedback."""
    feedback = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3}),
        label=_('Rejection Feedback'),
        help_text=_('This message will be sent to the user as a notification.'),
        max_length=500
    )


@admin.register(ProfileImageChangeRequest)
class ProfileImageChangeRequestAdmin(admin.ModelAdmin):
    """Admin interface for ProfileImageChangeRequest model."""

    list_display = [
        'image_thumbnail',
        'username',
        'status_badge',
        'created_at',
        'reviewed_by_display',
        'reviewed_at',
    ]

    list_filter = [
        'status',
        'created_at',
        'reviewed_at',
    ]

    search_fields = ['user__username', 'user__email']
    ordering = ['-created_at']
    readonly_fields = [
        'id', 'user', 'image', 'image_preview', 'status',
        'rejection_feedback', 'created_at', 'reviewed_at', 'reviewed_by'
    ]
    date_hierarchy = 'created_at'

    fieldsets = (
        (_('Request Details'), {
            'fields': ('user', 'status', 'created_at')
        }),
        (_('Image'), {
            'fields': ('image_preview',)
        }),
        (_('Review'), {
            'fields': ('reviewed_by', 'reviewed_at', 'rejection_feedback'),
        }),
        (_('System'), {
            'fields': ('id',),
            'classes': ('collapse',)
        })
    )

    actions = ['approve_requests']

    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('user', 'reviewed_by')

    @admin.display(description=_('Image'))
    def image_thumbnail(self, obj):
        """Display image thumbnail in list view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%;" />',
                obj.image.url
            )
        return '-'

    @admin.display(description=_('Image Preview'))
    def image_preview(self, obj):
        """Display larger image preview in detail view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px; object-fit: contain; border-radius: 8px;" />',
                obj.image.url
            )
        return '-'

    @admin.display(description=_('Username'), ordering='user__username')
    def username(self, obj):
        """Display username with link to user."""
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.user.id,
            obj.user.username
        )

    @admin.display(description=_('Status'))
    def status_badge(self, obj):
        """Display status with color badge."""
        colors = {
            'pending': '#ffc107',  # yellow
            'approved': '#28a745',  # green
            'rejected': '#dc3545',  # red
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )

    @admin.display(description=_('Reviewed By'))
    def reviewed_by_display(self, obj):
        """Display who reviewed the request."""
        if obj.reviewed_by:
            return obj.reviewed_by.username
        return '-'

    def approve_requests(self, request, queryset):
        """Approve selected pending profile image requests."""
        pending = queryset.filter(status=ProfileImageChangeRequest.Status.PENDING)
        approved_count = 0

        for change_request in pending:
            if change_request.image:
                # Copy image to user's profile
                user = change_request.user
                image_name = change_request.image.name.split('/')[-1]
                user.profile_image.save(
                    image_name,
                    ContentFile(change_request.image.read()),
                    save=True
                )

                # Update request status
                change_request.status = ProfileImageChangeRequest.Status.APPROVED
                change_request.reviewed_at = timezone.now()
                change_request.reviewed_by = request.user
                change_request.save()
                approved_count += 1

        self.message_user(request, f'{approved_count} profile image(s) approved.')
    approve_requests.short_description = _("Approve selected requests")

    def has_add_permission(self, request):
        """Disable adding requests from admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Allow viewing but not editing through form."""
        return True

    def change_view(self, request, object_id, form_url='', extra_context=None):
        """Add approve/reject buttons to change view for pending requests."""
        extra_context = extra_context or {}
        obj = self.get_object(request, object_id)

        if obj and obj.status == ProfileImageChangeRequest.Status.PENDING:
            extra_context['show_approve_reject'] = True
            extra_context['reject_form'] = RejectProfileImageForm()

        return super().change_view(request, object_id, form_url, extra_context)

    def response_change(self, request, obj):
        """Handle approve/reject actions from change view."""
        if '_approve' in request.POST:
            if obj.status == ProfileImageChangeRequest.Status.PENDING and obj.image:
                # Copy image to user's profile
                user = obj.user
                image_name = obj.image.name.split('/')[-1]
                user.profile_image.save(
                    image_name,
                    ContentFile(obj.image.read()),
                    save=True
                )

                # Update request status
                obj.status = ProfileImageChangeRequest.Status.APPROVED
                obj.reviewed_at = timezone.now()
                obj.reviewed_by = request.user
                obj.save()

                self.message_user(request, _('Profile image approved successfully.'))
            return self.response_post_save_change(request, obj)

        if '_reject' in request.POST:
            form = RejectProfileImageForm(request.POST)
            if form.is_valid() and obj.status == ProfileImageChangeRequest.Status.PENDING:
                feedback = form.cleaned_data['feedback']

                # Update request status
                obj.status = ProfileImageChangeRequest.Status.REJECTED
                obj.rejection_feedback = feedback
                obj.reviewed_at = timezone.now()
                obj.reviewed_by = request.user
                obj.save()

                # Send notification to user
                try:
                    from notifications.services import send_push_notification_to_user
                    send_push_notification_to_user(
                        user=obj.user,
                        title=str(_('Profile Image Rejected')),
                        body=feedback
                    )
                except Exception as e:
                    self.message_user(
                        request,
                        f'Profile image rejected but notification failed: {e}',
                        level='warning'
                    )
                else:
                    self.message_user(request, _('Profile image rejected and user notified.'))
            return self.response_post_save_change(request, obj)

        return super().response_change(request, obj)
