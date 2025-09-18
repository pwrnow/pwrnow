from django.conf import settings
from posthog import Posthog

posthog = Posthog(
    settings.POSTHOG_API_KEY,
    host=settings.POSTHOG_HOST
)
