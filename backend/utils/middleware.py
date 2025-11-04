"""
Custom middleware for security and request handling.
"""
from django.http import HttpResponseForbidden
from django.utils.translation import gettext as _


class HealthCheckLocalhostMiddleware:
    """
    Middleware that restricts the healthcheck endpoint to only be accessible from localhost.
    This allows Docker/Kubernetes healthchecks to work while preventing external access.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Check if this is a request to the healthcheck endpoint
        if request.path.startswith('/health'):
            # Get the client IP address
            # Check X-Forwarded-For header first (for proxied requests)
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                # Take the first IP in the chain
                client_ip = x_forwarded_for.split(',')[0].strip()
            else:
                client_ip = request.META.get('REMOTE_ADDR')

            # Allow only localhost/loopback addresses
            allowed_ips = ['127.0.0.1', '::1', 'localhost']

            if client_ip not in allowed_ips:
                return HttpResponseForbidden(
                    _("Health check endpoint is only accessible from localhost")
                )

        response = self.get_response(request)
        return response

