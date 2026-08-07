"""
ASGI config for Ticketing_tool project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

# import os
# import history.routing

# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ticketing_tool.settings')

# application = get_asgi_application()

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
# import history.routing  # your app
# from .import routing

import history.routing
import timer.routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ticketing_tool.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            history.routing.websocket_urlpatterns
            +timer.routing.websocket_urlpatterns
        )
    ),
})
