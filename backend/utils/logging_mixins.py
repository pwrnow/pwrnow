import logging
import time
from typing import Callable, Optional
from .logging import bind_context


logger = logging.getLogger(__name__)


class ApiLoggingMixin:
    """DRF mixin to log request start/end with context and duration."""

    def initialize_request(self, request, *args, **kwargs):  # type: ignore[override]
        request._pwrnow_start_time = time.time()
        user_id = getattr(getattr(request, "user", None), "id", None)
        endpoint = f"{self.__class__.__name__}.{getattr(self, 'action', request.method.lower())}"
        ctx = bind_context(user_id=user_id, organization_id=None, endpoint=endpoint)
        logger.info("API_REQUEST", extra=ctx)
        return super().initialize_request(request, *args, **kwargs)

    def finalize_response(self, request, response, *args, **kwargs):  # type: ignore[override]
        try:
            duration_ms = None
            if hasattr(request, "_pwrnow_start_time"):
                duration_ms = int((time.time() - request._pwrnow_start_time) * 1000)
        except Exception:
            duration_ms = None

        user_id = getattr(getattr(request, "user", None), "id", None)
        endpoint = f"{self.__class__.__name__}.{getattr(self, 'action', getattr(request, 'method', 'UNKNOWN').lower())}"
        ctx = bind_context(user_id=user_id, organization_id=None, endpoint=endpoint)

        level = logging.INFO
        if getattr(response, "status_code", 200) >= 500:
            level = logging.ERROR
        elif getattr(response, "status_code", 200) >= 400:
            level = logging.WARNING

        msg = f"API_RESPONSE status={getattr(response, 'status_code', 'NA')} duration_ms={duration_ms}"
        logger.log(level, msg, extra=ctx)
        return super().finalize_response(request, response, *args, **kwargs)


def log_api_call(endpoint_name: Optional[str] = None) -> Callable:
    """Decorator for function-based views to log start/end with context."""

    def decorator(func: Callable) -> Callable:
        def wrapper(request, *args, **kwargs):  # type: ignore[misc]
            start = time.time()
            user_id = getattr(getattr(request, "user", None), "id", None)
            endpoint = endpoint_name or getattr(func, "__name__", "api.func")
            ctx = bind_context(user_id=user_id, organization_id=None, endpoint=endpoint)
            logger.info("API_REQUEST", extra=ctx)
            try:
                response = func(request, *args, **kwargs)
                duration_ms = int((time.time() - start) * 1000)
                level = logging.INFO
                status_code = getattr(response, "status_code", 200)
                if status_code >= 500:
                    level = logging.ERROR
                elif status_code >= 400:
                    level = logging.WARNING
                logger.log(level, f"API_RESPONSE status={status_code} duration_ms={duration_ms}", extra=ctx)
                return response
            except Exception:
                duration_ms = int((time.time() - start) * 1000)
                logger.exception(f"API_EXCEPTION duration_ms={duration_ms}", extra=ctx)
                raise

        return wrapper

    return decorator


