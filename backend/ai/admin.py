from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AIProcessingLog


@admin.register(AIProcessingLog)
class AIProcessingLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_provider_display', 'status', 'organization', 'user', 'tokens_used', 'processing_time_ms', 'created_at']
    list_filter = ['status', 'provider_name', 'organization', 'created_at']
    search_fields = ['id', 'provider_name', 'error_message', 'organization__name', 'user__username', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def get_provider_display(self, obj):
        """Display the human-readable provider name."""
        return obj.get_provider_name_display()
    get_provider_display.short_description = 'Provider'
    get_provider_display.admin_order_field = 'provider_name'

    fieldsets = (
        (_('Basic Information'), {
            'fields': ('id', 'provider_name', 'status')
        }),
        (_('Request Data'), {
            'fields': ('input_text', 'prompt_used', 'model_used')
        }),
        (_('Response Data'), {
            'fields': ('output_text', 'tokens_used', 'processing_time_ms')
        }),
        (_('Error Information'), {
            'fields': ('error_message',)
        }),
        (_('Relationships'), {
            'fields': ('organization', 'user')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Disable adding logs through admin."""
        return False

    def has_change_permission(self, request, obj=None):
        """Disable editing logs through admin."""
        return False