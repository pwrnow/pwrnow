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
router.register(r'event-maps', views.EventMapViewSet, basename='event-map')
router.register(r'event-map-locations', views.EventMapLocationViewSet, basename='event-map-location')

# The API URLs are now determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('events/<slug:slug>/likes/', views.event_like, name='event-like'),
    path('scan-qr/', views.scan_qr_code, name='scan-qr'),
    
    # Friendship endpoints
    path('users/search/', views.search_users, name='search-users'),
    path('friends/', views.list_friends, name='list-friends'),
    path('friends/suggestions/', views.suggest_friends, name='suggest-friends'),
    path('friends/<uuid:friend_id>/remove/', views.remove_friend, name='remove-friend'),
    path('friend-requests/', views.list_friend_requests, name='list-friend-requests'),
    path('friend-requests/send/', views.send_friend_request, name='send-friend-request'),
    path('friend-requests/<uuid:request_id>/accept/', views.accept_friend_request, name='accept-friend-request'),
    path('friend-requests/<uuid:request_id>/reject/', views.reject_friend_request, name='reject-friend-request'),
]
