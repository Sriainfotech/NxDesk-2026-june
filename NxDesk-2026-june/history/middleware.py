from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class TicketChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group_name = f'ticket_{self.ticket_id}'

        # Get current logged-in user
        user = self.scope["user"]

        # Get ticket safely
        ticket = await self.get_ticket(self.ticket_id)

        # Validate user
        if user.id != ticket.created_by.id and user.id != ticket.assigned_to.id:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    @database_sync_to_async
    def get_ticket(self, ticket_id):
        from timer.models import Ticket
        return Ticket.objects.select_related('created_by', 'assigned_to').get(ticket_id=ticket_id)
