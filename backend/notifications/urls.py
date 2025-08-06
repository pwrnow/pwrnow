from django.urls import path
from .views import register_device

urlpatterns = [
    path('api/devices/', register_device, name='register_device'),
]