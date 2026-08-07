from channels.generic.websocket import AsyncWebsocketConsumer
import json
from channels.db import database_sync_to_async
from django.conf import settings
import jwt

# class TicketChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # Lazy import to avoid AppRegistryNotReady
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#         from rest_framework_simplejwt.tokens import UntypedToken

#         self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
#         self.room_group_name = f'ticket_{self.ticket_id}'

#         # Get token from query string
#         query_string = self.scope['query_string'].decode()
#         token = None
#         if 'token=' in query_string:
#             token = query_string.split('token=')[1]

#         if not token:
#             await self.close()
#             return

#         # Verify token
#         try:
#             UntypedToken(token)
#             decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#             self.user = await self.get_user(decoded_data['user_id'])
#         except Exception as e:
#             print("JWT error:", e)
#             await self.close()
#             return

#         # Fetch ticket
#         ticket = await self.get_ticket(self.ticket_id)
#         if self.user.id != ticket.created_by.id and self.user.id != ticket.assignee.id:
#             await self.close()
#             return

#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#     @database_sync_to_async
#     def get_user(self, user_id):
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#         return User.objects.get(id=user_id)

#     @database_sync_to_async
#     def get_ticket(self, ticket_id):
#         from timer.models import Ticket
#         return Ticket.objects.select_related('created_by', 'assignee').get(ticket_id=ticket_id)

#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data['message']

#         ticket = await self.get_ticket(self.ticket_id)
#         history = await self.save_message(ticket, self.user, message)

#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': history.title,
#                 'username': self.user.username,
#                 'created_at': history.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }
#         )

#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps(event))

#     @database_sync_to_async
#     def save_message(self, ticket, user, message):
#         from history.models import History
# #         return History.objects.create(ticket=ticket, created_by=user, title=message)
# import json
# import jwt
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.conf import settings
# # from django.contrib.auth import get_user_model

# # User = get_user_model()


# class TicketChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         """
#         Handle websocket connection:
#         - Authenticate using JWT
#         - Validate ticket access
#         - Join channel layer group
#         - Send previous messages
#         """
#         from rest_framework_simplejwt.tokens import UntypedToken
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#         from timer.models import Ticket

#         self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
#         self.room_group_name = f'ticket_{self.ticket_id}'

#         # Get token from query string
#         query_string = self.scope['query_string'].decode()
#         token = None
#         if 'token=' in query_string:
#             token = query_string.split('token=')[1]

#         if not token:
#             await self.close()
#             return

#         # Verify token and get user
#         try:
#             UntypedToken(token)
#             decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#             self.user = await self.get_user(decoded_data['user_id'])
#         except Exception as e:
#             print("JWT error:", e)
#             await self.close()
#             return

#         # Fetch ticket and check access
#         ticket = await self.get_ticket(self.ticket_id)
#         if self.user.id != ticket.created_by.id and self.user.id != ticket.assignee.id:
#             await self.close()
#             return

#         # Join group
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         # Send previous messages
#         previous_messages = await self.get_previous_messages(ticket)
#         for msg in previous_messages:
#             await self.send(text_data=json.dumps({
#                 'type': 'chat_message',
#                 'message': msg.title,
#                 'username': self.user.username,
#                 'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }))

#     async def disconnect(self, close_code):
#         """
#         Leave the ticket group on disconnect
#         """
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     async def receive(self, text_data):
#         """
#         Receive a message from websocket
#         - Save to database
#         - Broadcast to group
#         """
#         data = json.loads(text_data)
#         message = data.get('message', '').strip()
#         if not message:
#             return

#         ticket = await self.get_ticket(self.ticket_id)
#         history = await self.save_message(ticket, self.user, message)

#         await self.channel_layer.group_send(
#         self.room_group_name,
#         {
#             'type': 'chat_message',
#             'message': history.title,                # Only message text
#             'username': self.user.username,          # Sender
#             'created_at': history.created_at.strftime("%Y-%m-%d %H:%M:%S")  # Timestamp
#         }
#     )

#     async def chat_message(self, event):
#         """
#         Receive message from group and send to WebSocket
#         """
#         await self.send(text_data=json.dumps(event))

#     # ---------------- Database async methods ----------------

#     @database_sync_to_async
#     def get_user(self, user_id):
#         from login_details.models import User
#         from django.contrib.auth import get_user_model
#         return User.objects.get(id=user_id)

#     @database_sync_to_async
#     def get_ticket(self, ticket_id):
#         from timer.models import Ticket
#         return Ticket.objects.select_related('created_by', 'assignee').get(ticket_id=ticket_id)

#     # @database_sync_to_async
#     # def save_message(self, ticket, user, message):
#     #     from history.models import History
#     #     return History.objects.create(ticket=ticket, created_by=user, title=message)
#     @database_sync_to_async
#     def save_message(self, ticket, user, message):
#         from history.models import History
#         # Save the message with created_by set
#         return History.objects.create(ticket=ticket, title=message, created_by=user)



#     # @database_sync_to_async
#     # def get_previous_messages(self, ticket):
#     #     from history.models import History
#     #     # Only messages that are user-generated chat (adjust based on your model)
#     #     return History.objects.filter(ticket=ticket, type='chat').order_by('created_at')

#     @database_sync_to_async
#     def get_previous_messages(self, ticket):
#         from history.models import History
#         # Only messages that have a user who created them
#         return History.objects.filter(ticket=ticket, created_by__isnull=False).order_by('created_at')


# import json
# import jwt
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.conf import settings
# # from django.contrib.auth import get_user_model

# # User = get_user_model()


# class TicketChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#         self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
#         self.room_group_name = f'ticket_{self.ticket_id}'

#         # Get token from query string
#         query_string = self.scope['query_string'].decode()
#         token = None
#         if 'token=' in query_string:
#             token = query_string.split('token=')[1]

#         if not token:
#             await self.close()
#             return

#         # Verify token
#         try:
#             decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#             self.user = await self.get_user(decoded_data['user_id'])
#         except Exception as e:
#             print("JWT error:", e)
#             await self.close()
#             return

#         # Fetch ticket
#         ticket = await self.get_ticket(self.ticket_id)
#         if self.user.id != ticket.created_by.id and self.user.id != ticket.assignee.id:
#             await self.close()
#             return

#         # Join room
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         # Send previous messages
#         previous_messages = await self.get_previous_messages(ticket)
#         for msg in previous_messages:
#             await self.send(text_data=json.dumps({
#                 'type': 'chat_message',
#                 'message': msg.title,
#                 # 'username': msg.created_by.username,
#                 'username': msg.created_by.username if msg.created_by else "System",
#                 'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }))

#     @database_sync_to_async
#     def get_user(self, user_id):
#         from login_details.models import User
#         return User.objects.get(id=user_id)

#     @database_sync_to_async
#     def get_ticket(self, ticket_id):
#         from timer.models import Ticket
#         return Ticket.objects.select_related('created_by', 'assignee').get(ticket_id=ticket_id)


#     @database_sync_to_async
#     def get_previous_messages(self, ticket):
#         from history.models import History
#         return list(
#             History.objects.filter(ticket=ticket, created_by__isnull=False)
#                         .order_by('created_at')
#         )



   
#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data['message']

#         ticket = await self.get_ticket(self.ticket_id)
#         history = await self.save_message(ticket, self.user, message)

#         # Send to group using the actual creator from the database
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': history.title,
#                 'username': history.created_by.username if history.created_by else "Unknown",
#                 'created_at': history.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }
#         )


#     async def chat_message(self, event):
#         await self.send(text_data=json.dumps(event))

#     @database_sync_to_async
#     def save_message(self, ticket, user, message):
#         from history.models import History
#         return History.objects.create(ticket=ticket, title=message, created_by=user)



# import json
# import jwt
# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.conf import settings


# class TicketChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         from django.contrib.auth import get_user_model
#         User = get_user_model()
#         self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
#         self.room_group_name = f'ticket_{self.ticket_id}'

#         # Get token from query string
#         query_string = self.scope['query_string'].decode()
#         token = None
#         if 'token=' in query_string:
#             token = query_string.split('token=')[1]

#         if not token:
#             await self.close()
#             return

#         # Verify token
#         try:
#             decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
#             self.user = await self.get_user(decoded_data['user_id'])
#         except Exception as e:
#             print("JWT error:", e)
#             await self.close()
#             return

#         # Fetch ticket
#         ticket = await self.get_ticket(self.ticket_id)
#         if self.user.id != ticket.created_by.id and self.user.id != ticket.assignee.id:
#             await self.close()
#             return

#         # Join room
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)
#         await self.accept()

#         # Send previous messages with correct sender usernames
#         previous_messages = await self.get_previous_messages(ticket)
#         for msg in previous_messages:
#             await self.send(text_data=json.dumps({
#                 'type': 'chat_message',
#                 'message': msg.title,
#                 'username': msg.created_by.username if msg.created_by else "System",
#                 'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }))

#     @database_sync_to_async
#     def get_user(self, user_id):
#         from login_details.models import User
#         return User.objects.get(id=user_id)

#     @database_sync_to_async
#     def get_ticket(self, ticket_id):
#         from timer.models import Ticket
#         return Ticket.objects.select_related('created_by', 'assignee').get(ticket_id=ticket_id)

#     @database_sync_to_async
#     def get_previous_messages(self, ticket):
#         from history.models import History
#         # Use select_related to fetch 'created_by' in the same query
#         return list(
#             History.objects.filter(ticket=ticket, created_by__isnull=False)
#                         .select_related('created_by')
#                         .order_by('created_at')
#         )



#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data['message']

#         ticket = await self.get_ticket(self.ticket_id)
#         history = await self.save_message(ticket, self.user, message)

#         # Broadcast message to group with correct sender username
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': history.title,
#                 'attachement_url': history.attachement_url,
#                 'username': history.created_by.username if history.created_by else "System",
#                 'created_at': history.created_at.strftime("%Y-%m-%d %H:%M:%S")
#             }
#         )

#     async def chat_message(self, event):
#         # Simply forward the event to WebSocket
#         await self.send(text_data=json.dumps(event))

#     @database_sync_to_async
#     def save_message(self, ticket, user, message):
#         from history.models import History
#         # Save the message with the correct sender
#         return History.objects.create(ticket=ticket, title=message, created_by=user)



# consumers.py
import json
import jwt
import os
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings


class TicketChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()

        self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
        self.room_group_name = f'ticket_{self.ticket_id}'
        query_string = self.scope['query_string'].decode()

        # ✅ Extract JWT token
        token = None
        if 'token=' in query_string:
            token = query_string.split('token=')[1]

        if not token:
            await self.close()
            return

        # ✅ Decode token & verify user
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            self.user = await self.get_user(decoded['user_id'])
        except Exception as e:
            print("JWT error:", e)
            await self.close()
            return

        # ✅ Verify ticket access
        ticket = await self.get_ticket(self.ticket_id)
        if self.user.id not in [ticket.created_by_id, ticket.assignee_id]:
            await self.close()
            return

        # ✅ Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # ✅ Send chat history
        previous_messages = await self.get_previous_messages(ticket)
        for msg in previous_messages:
            attachments = [a.file.url for a in msg.attachments.all()]
            await self.send(text_data=json.dumps({
                "type": "chat_message",
                "message": msg.title,
                "attachments": attachments,
                "username": msg.created_by.username if msg.created_by else "System",
                "created_at": msg.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # async def receive(self, text_data):
    #     """
    #     Handles:
    #     - Normal chat messages
    #     - Attachment messages (after upload API)
    #     """
    #     data = json.loads(text_data)
    #     message = data.get("message", "").strip()
    #     attachment_urls = data.get("attachments", [])

    #     # Skip empty messages
    #     if not message and not attachment_urls:
    #         return

    #     ticket = await self.get_ticket(self.ticket_id)
    #     history = await self.save_message(ticket, self.user, message or "[Attachment]")

    #     # ✅ Link uploaded attachments to this chat message
    #     for url in attachment_urls:
    #         await self.link_attachment_to_history(url, history)

    #     # ✅ Broadcast to group
    #     await self.channel_layer.group_send(
    #         self.room_group_name,
    #         {
    #             "type": "chat_message",
    #             "message": message or "📎 Attachment",
    #             "attachments": attachment_urls,
    #             "username": self.user.username,
    #             "created_at": history.created_at.strftime("%Y-%m-%d %H:%M:%S"),
    #         },
    #     )

    async def receive(self, text_data):
        """
        Handles incoming WebSocket messages:
        - Only text
        - Only attachments
        - Text + attachments
        """
        data = json.loads(text_data)
        message = data.get("message", "").strip()
        attachment_urls = data.get("attachments", [])

        # Skip completely empty messages
        if not message and not attachment_urls:
            return

        # Get ticket and save message
        ticket = await self.get_ticket(self.ticket_id)

        # Decide what message text to show
        if not message and attachment_urls:
            # Only attachments
            chat_message_text = "📎 New attachment uploaded"
            history_message_text = "[Attachment]"  # Store in DB
        else:
            # Message with or without attachments
            chat_message_text = message
            history_message_text = message

        # Save to history
        history = await self.save_message(ticket, self.user, history_message_text)

        # Link uploaded attachments to this history record
        for url in attachment_urls:
            await self.link_attachment_to_history(url, history)

        # Broadcast to all users in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": chat_message_text,
                "attachments": attachment_urls,
                "username": self.user.username,
                "created_at": history.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            },
        )



    async def chat_message(self, event):
        """Send event to all connected WebSocket clients"""
        await self.send(text_data=json.dumps(event))

    # -------------------- Database methods -------------------- #
    @database_sync_to_async
    def get_user(self, user_id):
        from login_details.models import User
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def get_ticket(self, ticket_id):
        from timer.models import Ticket
        return Ticket.objects.select_related("created_by", "assignee").get(ticket_id=ticket_id)

    @database_sync_to_async
    def get_previous_messages(self, ticket):
        from history.models import History
        return list(
            History.objects.filter(ticket=ticket, created_by__isnull=False)
            .select_related("created_by")
            .prefetch_related("attachments")
            .order_by("created_at")
        )

    @database_sync_to_async
    def save_message(self, ticket, user, message):
        from history.models import History
        return History.objects.create(ticket=ticket, title=message, created_by=user)

   
    @database_sync_to_async
    def link_attachment_to_history(self, file_url, history):
        from history.models import Attachment
        import os

        # Extract filename from URL
        filename = os.path.basename(file_url)

        # Match attachments by filename and ticket
        attachments = Attachment.objects.filter(file__icontains=filename, ticket=history.ticket)
        if attachments.exists():
            attachments.update(history=history)
            print(f"✅ Linked {attachments.count()} attachment(s) to history ID {history.history_id}")
        else:
            print(f"⚠️ No attachment found for {filename}")

