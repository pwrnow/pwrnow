from django.urls import path
from .views import parse_schedule

urlpatterns = [
    path('parse-schedule/', parse_schedule, name='parse-schedule'),
]
