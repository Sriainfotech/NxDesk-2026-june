from django.urls import re_path
from .consumers import TimerConsumer

websocket_urlpatterns = [
    # This URL will be used by the frontend to connect to this ticket's timer
    # re_path(r'ws/timer/(?P<ticket_id>[\w]+)/$', TimerConsumer.as_asgi()),
    re_path(r'ws/timer/(?P<ticket_id>[\w-]+)/$', TimerConsumer.as_asgi()),
]
