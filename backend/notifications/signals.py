import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Event
from .services import push_service
from django.conf import settings

logger = logging.getLogger(__name__)