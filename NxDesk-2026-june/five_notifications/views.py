from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
# from Knowledge_article.models import KnowledgeArticle
from .models import Announcement,Appreciation
from .serializers import AppreciationSerializer,AnnouncementSerializer,RecentItemSerializer
from django.utils.timezone import now
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import RecentItem
from timer.models import Ticket
from timer.serializers import TicketSerializer
from datetime import timedelta

 
 
class AnnouncementAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes= [JWTAuthentication]
    def get(self, request, pk=None):
        if pk:
            try:
                announcement = Announcement.objects.get(pk=pk)
                serializer = AnnouncementSerializer(announcement)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Announcement.DoesNotExist:
                return Response({"error": "Announcement not found"}, status=status.HTTP_404_NOT_FOUND)
        announcements = Announcement.objects.all()
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    def post(self, request):
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            announcement = serializer.save(created_by=request.user, updated_by=request.user)
            announcement.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   
    def put(self, request, pk=None):
        if not pk:
            return Response({"error": "Missing PK for update"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            announcement = Announcement.objects.get(pk=pk)
            serializer = AnnouncementSerializer(announcement, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Announcement.DoesNotExist:
            return Response({"error": "Announcement not found"}, status=status.HTTP_404_NOT_FOUND)
 
    def delete(self, request, pk=None):
        if not pk:
            return Response({"error": "Missing PK for delete"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            announcement = Announcement.objects.get(pk=pk)
            announcement.delete()
            return Response({"message": "Announcement deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Announcement.DoesNotExist:
            return Response({"error": "Announcement not found"}, status=status.HTTP_404_NOT_FOUND)
       
 
 
 
class AppreciationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None):
        if pk:
            try:
                appreciation = Appreciation.objects.get(pk=pk)
                serializer = AppreciationSerializer(appreciation)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Appreciation.DoesNotExist:
                return Response({"error": "Appreciation not found"}, status=status.HTTP_404_NOT_FOUND)
        appreciations = Appreciation.objects.all()
        serializer = AppreciationSerializer(appreciations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    def post(self, request):
        serializer = AppreciationSerializer(data=request.data)
        if serializer.is_valid():
            appreciation = serializer.save(created_by=request.user, updated_by=request.user)
            appreciation.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def put(self, request, pk=None):
        if not pk:
            return Response({"error": "Missing PK for update"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            appreciation = Appreciation.objects.get(pk=pk)
            serializer = AppreciationSerializer(appreciation, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Appreciation.DoesNotExist:
            return Response({"error": "Appreciation not found"}, status=status.HTTP_404_NOT_FOUND)
 
    def delete(self, request, pk=None):
        if not pk:
            return Response({"error": "Missing PK for delete"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            appreciation = Appreciation.objects.get(pk=pk)
            appreciation.delete()
            return Response({"message": "Appreciation deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Appreciation.DoesNotExist:
            return Response({"error": "Appreciation not found"}, status=status.HTTP_404_NOT_FOUND)
 

 

class PopularItemsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        # Get the timeframe parameter (e.g., last 7 days)
        timeframe = request.query_params.get('timeframe', '7')
        start_date = now() - timedelta(days=int(timeframe))
        
        # Query popular tickets based on view_count or interactions
        popular_tickets = Ticket.objects.filter(updated_at__gte=start_date).order_by('-view_count')[:10]
        
        # Serialize and return data
        data = [{"id": ticket.id, "title": ticket.title, "view_count": ticket.view_count} for ticket in popular_tickets]
        return Response({"popular_items": data})



class OpenItemsAPIView(APIView):
    def get(self, request, *args, **kwargs):
        # Fetch tickets with status 'Active'
        active_tickets = Ticket.objects.filter(status="Active")
        
        # Serialize the data
        serializer = TicketSerializer(active_tickets, many=True)
        
        # Return serialized data as response
        return Response(serializer.data, status=status.HTTP_200_OK)



class RecentItemView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        recent_items = RecentItem.objects.filter(user=request.user)[:10]  # Limit to last 10 items
        serializer = RecentItemSerializer(recent_items, many=True)
        return Response(serializer.data)
    
    def get(self, request, *args, **kwargs):
        user = request.user  # Assuming you're filtering by the logged-in user
        recent_items = RecentItem.objects.filter(user=user)
        
        # Serialize the data
        serializer = RecentItemSerializer(recent_items, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    