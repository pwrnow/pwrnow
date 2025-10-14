import logging
import threading
import uuid
from typing import Optional


_local = threading.local()


def get_request_id() -> Optional[str]:
    """Return the current request id if available."""
    return getattr(_local, "request_id", None)


def set_request_id(request_id: Optional[str]) -> None:
    """Set the current request id in thread-local storage."""
    if request_id is None:
        if hasattr(_local, "request_id"):
            delattr(_local, "request_id")
    else:
        _local.request_id = request_id


class RequestIdMiddleware:
    """Middleware that ensures each request has a request ID for log correlation."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming_request_id = (
            request.META.get("HTTP_X_REQUEST_ID")
            or request.META.get("HTTP_X_CORRELATION_ID")
        )
        request_id = incoming_request_id or str(uuid.uuid4())
        set_request_id(request_id)

        # Expose request_id on the request for downstream usage
        setattr(request, "request_id", request_id)

        try:
            response = self.get_response(request)
        finally:
            # Clear after response to avoid leaking between requests
            set_request_id(None)

        # Return request id to caller so it can be propagated by clients
        response["X-Request-ID"] = request_id
        return response


class ContextFilter(logging.Filter):
    """Inject dynamic context like request_id, user_id, and organization_id."""

    def filter(self, record: logging.LogRecord) -> bool:
        # Request ID
        record.request_id = get_request_id() or "-"

        # Optional user/org context if provided by calling sites
        if not hasattr(record, "user_id"):
            record.user_id = "-"
        if not hasattr(record, "organization_id"):
            record.organization_id = "-"
        if not hasattr(record, "endpoint"):
            record.endpoint = "-"
        return True


def bind_context(**kwargs):
    """Create an extra dict that merges given context with defaults expected by the filter."""
    extra = {
        "user_id": kwargs.get("user_id", "-"),
        "organization_id": kwargs.get("organization_id", "-"),
        "endpoint": kwargs.get("endpoint", "-"),
    }
    return {"extra": extra}


