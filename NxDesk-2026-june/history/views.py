from django.shortcuts import render
from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import timedelta
from roles_creation.permissions import HasRolePermission
from .serializers import TicketHistorySerializer,ReportSerializer,AttachmentSerializer
from .models import History,Reports,Attachment
from timer.models import Ticket

class HistoryAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, ticket=None):
        self.permission_required = "view_history"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        
        
        try:
            ticket = request.query_params.get('ticket')
            print(ticket)
            history = History.objects.filter(ticket=ticket)
            serializer = TicketHistorySerializer(history, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except:
          return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
    
 

    def post(self, request, *args, **kwargs):
            self.permission_required = "create_history"
            if not HasRolePermission().has_permission(request, self.permission_required):
                return Response({'error': 'Permission denied.'}, status=403)
            serializer = TicketHistorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(modified_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
          
class ReportAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        self.permission_required = "view_report"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        ticket = request.query_params.get('ticket')
        if not ticket:
            return Response({"error": "Ticket parameter is required"},status=status.HTTP_400_BAD_REQUEST)
        try:
            report = Reports.objects.filter(ticket=ticket)
            if not report.exists():
                return Response({"error": "No reports found for the given ticket"},status=status.HTTP_404_NOT_FOUND)
            serializer = ReportSerializer(report, many=True,context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"An error occurred: {str(e)}"},status=status.HTTP_400_BAD_REQUEST)
 
    def post(self, request, *args, **kwargs):
            self.permission_required = "create_report"
            if not HasRolePermission().has_permission(request, self.permission_required):
                return Response({'error': 'Permission denied.'}, status=403)
            serializer = ReportSerializer(data=request.data,context={'request': request})
            if serializer.is_valid():
                serializer.save(modified_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import jwt
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
@method_decorator(csrf_exempt, name='dispatch')      
class AttachmentsAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]



    def get(self, request):
        ticket_id = request.query_params.get("ticket_id")
        user = request.user
 
        try:
            ticket = Ticket.objects.get(ticket_id=ticket_id)
        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found"}, status=404)
 
        if ticket.created_by_id == user.id or ticket.assignee_id == user.id:
            attachments = Attachment.objects.filter(ticket=ticket)
            serializer = AttachmentSerializer(attachments, many=True)
            return Response(serializer.data)
 
        return Response({"detail": "You do not have permission to view these attachments."}, status=403)
    
    
    

    # def post(self, request, *args, **kwargs):
    #     ticket_id = request.data.get("ticket_id")
    #     file = request.FILES.get("file")

    #     if file.size > 10 * 1024 * 1024:  # 10 MB limit
    #         # send websocket message for error
    #         channel_layer = get_channel_layer()
    #         async_to_sync(channel_layer.group_send)(
    #             f"ticket_{ticket_id}",
    #             {
    #                 "type": "send_notification",
    #                 "message": f"File size limit exceeded for {file.name}.",
    #                 "status": "error"
    #             }
    #         )
    #         return Response({"error": "File size limit exceeded"}, status=status.HTTP_400_BAD_REQUEST)

    #     # Save the file normally (simplified)
    #     # Attachment.objects.create(ticket_id=ticket_id, file=file)

    #     # send success message to websocket
    #     channel_layer = get_channel_layer()
    #     async_to_sync(channel_layer.group_send)(
    #         f"ticket_{ticket_id}",
    #         {
    #             "type": "send_notification",
    #             "message": f"File '{file.name}' uploaded successfully!",
    #             "status": "success"
    #         }
    #     )

    #     return Response({"message": "File uploaded successfully!"}, status=status.HTTP_201_CREATED)

    def post(self, request, ticket_id, *args, **kwargs):
        file = request.FILES.get("file")

        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ File size validation (10MB)
        if file.size > 10 * 1024 * 1024:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"ticket_{ticket_id}",
                {
                    "type": "chat_message",
                    "message": f"❌ File '{file.name}' size limit exceeded (10MB).",
                    "attachments": [],
                    "username": request.user.username,
                    "created_at": "",
                },
            )
            return Response({"error": "File size limit exceeded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ Get ticket
            ticket = Ticket.objects.get(ticket_id=ticket_id)

            # ✅ Save the attachment
            attachment = Attachment.objects.create(ticket=ticket, file=file)

            # ✅ Create a History message
            history = History.objects.create(
                ticket=ticket,
                title="[Attachment]",
                created_by=request.user,
            )
            attachment.history = history
            attachment.save()

            # ✅ Notify via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"ticket_{ticket_id}",
                {
                    "type": "chat_message",
                    "message": "📎 New attachment uploaded",
                    "attachments": [attachment.file.url],
                    "username": request.user.username,
                    "created_at": history.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                },
            )

            return Response(
                {
                    "message": "File uploaded successfully!",
                    "file_url": attachment.file.url,
                },
                status=status.HTTP_201_CREATED,
            )

        except Ticket.DoesNotExist:
            return Response({"error": "Ticket not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print("Upload error:", e)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 

class TicketChatHistory(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):
        messages = History.objects.filter(ticket__ticket_id=ticket_id).order_by('created_at')
        data = [
            {
                'username': msg.created_by.username,
                'message': msg.title,
                'created_at': msg.created_at
            } for msg in messages
        ]
        return Response(data)
