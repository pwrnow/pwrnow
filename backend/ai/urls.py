from django.urls import path
from .views import parse_schedule, parse_schedule_availability, check_feature_access

urlpatterns = [
    path('parse-schedule/', parse_schedule, name='parse-schedule'),
    path('parse-schedule/availability/', parse_schedule_availability, name='parse-schedule-availability'),
    path('feature-access/', check_feature_access, name='check-feature-access'),
]
