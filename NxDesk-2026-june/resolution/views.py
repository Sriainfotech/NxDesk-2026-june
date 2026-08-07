from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .models import Resolution
from .serializers import ResolutionSerializer
from roles_creation.permissions import HasRolePermission
from rest_framework_simplejwt.authentication import JWTAuthentication

class ResolutionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, ticket_id=None):  # Here, pk is expected to be ticket_id now
        self.permission_required = "view_resolution"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)
    
        if ticket_id:
            resolutions = Resolution.objects.filter(ticket_id=ticket_id)
            if not resolutions.exists():
                return Response({'error': 'No resolution found for this ticket.'}, status=404)
            serializer = ResolutionSerializer(resolutions, many=True)
        else:
            resolutions = Resolution.objects.all()
            serializer = ResolutionSerializer(resolutions, many=True)
    
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        self.permission_required = "create_resolution"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        serializer = ResolutionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        self.permission_required = "update_resolution"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        resolution = get_object_or_404(Resolution, pk=pk)
        serializer = ResolutionSerializer(resolution, data=request.data, partial=True)
        if serializer.is_valid(): 
            serializer.save(modified_by=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        self.permission_required = "delete_resolution"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        resolution = get_object_or_404(Resolution, pk=pk)
        resolution.delete()
        return Response({"message": "Resolution deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

class ResolutionChoicesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get(self, request):
        self.permission_required = "view_resolution"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)
        choices = {
            "resolution_type_choices": Resolution.resolution_choices,
            "incident_based_on_choices": Resolution.incident_choices,
            "incident_category_choices": Resolution.incident_category_choices,
        }
        return Response(choices)