from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import AIProcessingLog


@admin.register(AIProcessingLog)
class AIProcessingLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'provider_name', 'status', 'organization', 'user', 'tokens_used', 'processing_time_ms', 'created_at']
    list_filter = ['status', 'provider_name', 'organization', 'created_at']
    search_fields = ['id', 'provider_name', 'error_message', 'organization__name', 'user__email']
    readonly_fields = ['id', 'created_at', 'updated_at']

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