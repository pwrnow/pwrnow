from rest_framework.throttling import SimpleRateThrottle


class OrganizationRateThrottle(SimpleRateThrottle):
    """
    Limit requests per authenticated organization using session-stored org id.

    Scope is configured via REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] under 'ai_parse'.
    """

    scope = 'ai_parse'

    def get_cache_key(self, request, view):
        org_id = request.session.get('authenticated_org_id')
        if not org_id:
            # If no organization is authenticated, do not throttle here
            # The view will return 401 itself.
            return None

        ident = f"org:{org_id}"
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


