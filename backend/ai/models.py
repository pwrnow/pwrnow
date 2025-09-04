from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import uuid


class AIProcessingLog(models.Model):
    """Log of AI processing requests for debugging and analytics."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider_name = models.CharField(max_length=50, default='openai')

    # Request data
    input_text = models.TextField()
    prompt_used = models.TextField()
    model_used = models.CharField(max_length=100)

    # Response data
    output_text = models.TextField(blank=True, null=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    processing_time_ms = models.IntegerField(null=True, blank=True)

    # Status and metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True, null=True)

    # Relationships
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_processing_logs'
    )
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='ai_processing_logs'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['provider_name', 'created_at']),
            models.Index(fields=['organization', 'created_at']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        return f"AI Processing {self.id} - {self.get_status_display()}"