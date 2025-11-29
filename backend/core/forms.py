from django import forms
from .models import Organization, Event
from .widgets import ClipboardImageWidget, AIProcessingWidget


class OrganizationAdminForm(forms.ModelForm):
    """
    Custom form for Organization admin with clipboard image support
    """
    
    class Meta:
        model = Organization
        fields = '__all__'
        widgets = {
            'image': ClipboardImageWidget(),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Add some help text for the image field
        self.fields['image'].help_text = (
            "Upload an organization logo/image. You can either paste an image from your clipboard "
            "(Ctrl+V or Cmd+V) or use the file upload below. Maximum size: 5MB."
        )


class EventAdminForm(forms.ModelForm):
    """
    Custom form for Event admin with clipboard image support
    """
    
    class Meta:
        model = Event
        fields = '__all__'
        widgets = {
            'image': ClipboardImageWidget(),
        }

    ai_image = forms.ImageField(
        required=False,
        widget=AIProcessingWidget,
        label="AI Auto-Fill from Image",
        help_text="Upload an image to auto-fill event details."
    )
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # Add some help text for the image field
        self.fields['image'].help_text = (
            "Upload an event image/poster. You can either paste an image from your clipboard "
            "(Ctrl+V or Cmd+V) or use the file upload below. Maximum size: 5MB."
        )
