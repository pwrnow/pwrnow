from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone
from functools import wraps
from .models import OrganizationCode, Organization
import logging
from utils.logging import bind_context

logger = logging.getLogger(__name__)


def authenticate_organization(request, organization_code):
    """
    Authenticate an organization using its code and store in session.

    Args:
        request: The current request
        organization_code: The organization authentication code

    Returns:
        Organization instance if authentication successful, None otherwise
    """
    if not organization_code:
        return None

    try:
        # Find the organization code
        org_code = OrganizationCode.objects.select_related('organization').get(
            code=organization_code
        )
        organization = org_code.organization

        # Update last used timestamp
        org_code.last_used_at = timezone.now()
        org_code.save(update_fields=['last_used_at'])

        # Store organization info in session
        request.session['authenticated_org_id'] = str(organization.id)
        request.session['authenticated_org_slug'] = organization.slug
        request.session['authenticated_org_name'] = organization.name
        request.session.modified = True

        ctx = bind_context(
            user_id=getattr(getattr(request, 'user', None), 'id', None),
            organization_id=getattr(organization, 'id', None),
            endpoint='auth.authenticate_organization',
        )
        logger.info("ORG_AUTH_SUCCESS", extra=ctx)

        return organization

    except OrganizationCode.DoesNotExist:
        logger.warning("ORG_AUTH_CODE_NOT_FOUND", extra=bind_context(endpoint='auth.authenticate_organization'))
        return None


def get_current_organization(request):
    """
    Get the currently authenticated organization from session.

    Args:
        request: The current request

    Returns:
        Organization instance if authenticated, None otherwise
    """
    org_id = request.session.get('authenticated_org_id')
    if not org_id:
        return None

    try:
        organization = Organization.objects.get(id=org_id)
        return organization
    except Organization.DoesNotExist:
        # Clear invalid session data
        clear_organization_session(request)
        logger.warning("ORG_SESSION_INVALID", extra=bind_context(endpoint='auth.get_current_organization'))
        return None


def clear_organization_session(request):
    """
    Clear organization authentication from session.

    Args:
        request: The current request
    """
    request.session.pop('authenticated_org_id', None)
    request.session.pop('authenticated_org_slug', None)
    request.session.pop('authenticated_org_name', None)
    request.session.modified = True
    logger.info("ORG_SESSION_CLEARED", extra=bind_context(endpoint='auth.clear_organization_session'))


def organization_required(view_func):
    """
    Decorator that requires organization authentication.

    Returns 401 if no organization is authenticated.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        organization = get_current_organization(request)
        if not organization:
            return JsonResponse(
                {'error': 'No organization authenticated'},
                status=401
            )

        # Add organization to request for easy access
        request.organization = organization
        return view_func(request, *args, **kwargs)

    return _wrapped_view


class OrganizationAuthenticationMixin:
    """
    Mixin for DRF views that require organization authentication.
    """

    def get_current_organization(self):
        """Get the currently authenticated organization."""
        return get_current_organization(self.request)

    def check_organization_authentication(self):
        """Check if organization is authenticated, raise error if not."""
        organization = self.get_current_organization()
        if not organization:
            from rest_framework.exceptions import NotAuthenticated
            raise NotAuthenticated('No organization authenticated')
        return organization