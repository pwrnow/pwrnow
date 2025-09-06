from django.urls import path
from .views import parse_schedule, parse_schedule_availability

urlpatterns = [
    path('parse-schedule/', parse_schedule, name='parse-schedule'),
    path('parse-schedule/availability/', parse_schedule_availability, name='parse-schedule-availability'),
]
