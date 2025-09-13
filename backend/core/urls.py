from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'posts', views.PostViewSet, basename='post')
router.register(r'schedule-items', views.ScheduleItemViewSet, basename='schedule-item')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('events/<slug:slug>/likes/', views.event_like, name='event-like'),
    path('scan-qr/', views.scan_qr_code, name='scan-qr'),
]
