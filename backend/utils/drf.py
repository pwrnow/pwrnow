import logging
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status
from .logging import bind_context


logger = logging.getLogger(__name__)


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    request = context.get("request")
    view = context.get("view")

    endpoint_name = None
    if view is not None:
        endpoint_name = getattr(view, "__class__", type(view)).__name__

    user_id = getattr(getattr(request, "user", None), "id", None) if request else None

    ctx = bind_context(
        user_id=user_id,
        organization_id=None,
        endpoint=endpoint_name or "drf.exception",
    )

    if response is not None:
        # Known DRF-handled exception; log at warning for 4xx, error for 5xx
        level = logging.WARNING if 400 <= response.status_code < 500 else logging.ERROR
        logger.log(level, f"DRF_EXCEPTION status={response.status_code} detail={getattr(response, 'data', None)}", extra=ctx)
        return response

    # Unhandled exception; ensure a 500 response and log stack
    logger.exception("DRF_UNHANDLED_EXCEPTION", extra=ctx)  # keep stacktrace
    return Response({"detail": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


