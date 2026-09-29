import logging

from rest_framework.views import exception_handler as drf_default_exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """Global DRF exception handler - a safety net for exceptions that
    reach DRF without ever being caught locally (the ~10+ existing
    `except Exception as e: return Response({"error": str(e)}, ...)`
    call sites across the codebase already handle their own errors and
    are unaffected by this; this only catches genuinely unhandled crashes
    that would otherwise surface Django's own DEBUG-dependent error
    response). Logs the real exception server-side and returns a
    generic, safe message to the client either way.
    """
    response = drf_default_exception_handler(exc, context)

    if response is not None:
        return response

    view = context.get('view')
    logger.exception("Unhandled exception in %s", getattr(view, '__class__', view))
    return Response(
        {"error": "An unexpected error occurred. Please try again."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
