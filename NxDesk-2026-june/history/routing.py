from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # allow alphanumeric ticket IDs
    re_path(r'ws/ticket/(?P<ticket_id>[\w-]+)/$', consumers.TicketChatConsumer.as_asgi()),
]
