from django.shortcuts import render

# Create your views here.
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import IssueCategory, IssueType
from .serializers import IssueCategorySerializer, IssueTypeSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from roles_creation.permissions import HasRolePermission, is_root_org_user
import requests
from django.conf import settings


class IssueCategoryListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get(self, request, *args, **kwargs):
        category_id = kwargs.get('pk')  # Expecting 'pk' from URL
        
        if category_id:
            try:
                category = IssueCategory.objects.get(pk=category_id)
                serializer = IssueCategorySerializer(category, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            except IssueCategory.DoesNotExist:
                return Response({'error': 'Issue Category not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        else:
            categories = IssueCategory.objects.all()
            serializer = IssueCategorySerializer(categories, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if not HasRolePermission().has_permission(request, "create_issue_category"):
            return Response({"error": "You do not have permission to create issue categories."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer = IssueCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get_object(self, pk):
        """
        Helper method to get a category by pk.
        """
        try:
            return IssueCategory.objects.get(pk=pk)
        except IssueCategory.DoesNotExist:
            return None

    def put(self, request, *args, **kwargs):
        if not HasRolePermission().has_permission(request, "update_issue_category"):
            return Response({"error": "You do not have permission to update issue categories."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        category_id = kwargs.get('pk')
        if not category_id:
            return Response({'detail': 'Category ID is missing.'}, status=status.HTTP_400_BAD_REQUEST)

        # Retrieve the category object
        category = self.get_object(category_id)
        if not category:
            return Response({'detail': 'Category not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the data, allowing partial updates if necessary
        serializer = IssueCategorySerializer(category, data=request.data, context={'request': request}, partial=True)
        if serializer.is_valid():
            serializer.save(modified_by=request.user)  # Save the modified_by field
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def delete(self, request, *args, **kwargs):
        if not HasRolePermission().has_permission(request, "delete_issue_category"):
            return Response({"error": "You do not have permission to delete issue categories."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        category_id = kwargs.get('pk')
        if not category_id:
            return Response({"error": "Category ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        category = self.get_object(category_id)
        if not category:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

        category.delete()
        return Response({"message": "Category deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, *args, **kwargs):
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        category_id = kwargs.get('pk')
        if not category_id:
            return Response({"error": "Category ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        category = self.get_object(category_id)
        if not category:
            return Response({"error": "Category not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = IssueCategorySerializer(category, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class IssueTypeListAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get(self, request, issue_type_id=None):
        if issue_type_id is not None:
            try:
                issue_type = IssueType.objects.get(pk=issue_type_id)
            except IssueType.DoesNotExist:
                return Response({"error": "Issue Type not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = IssueTypeSerializer(issue_type, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        category_id = request.query_params.get('category')
        issue_types = IssueType.objects.all()
        if category_id:
            issue_types = issue_types.filter(category_id=category_id)
        serializer = IssueTypeSerializer(issue_types, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self,request):
        if not HasRolePermission().has_permission(request, "create_issue_type"):
            return Response({"error": "You do not have permission to create issue types."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer = IssueTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request,issue_type_id):
        if not HasRolePermission().has_permission(request, "update_issue_type"):
            return Response({"error": "You do not have permission to update issue types."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            issue_type = IssueType.objects.get(pk=issue_type_id)
        except IssueType.DoesNotExist:
            return Response({"error": "Issue Type not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = IssueTypeSerializer(issue_type, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def delete(self, request, *args, **kwargs):
        if not HasRolePermission().has_permission(request, "delete_issue_type"):
            return Response({"error": "You do not have permission to delete issue types."}, status=status.HTTP_403_FORBIDDEN)
        if not is_root_org_user(request):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        # Was reading the wrong kwarg name (category_id) - the URL
        # (issue-types/<int:issue_type_id>/) never provides that, so this
        # endpoint always returned 400 regardless of input.
        category_id = kwargs.get('issue_type_id')
        if category_id is None:
            return Response({"error": "Issue Type ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Assuming you have a model IssueType
        try:
            issue_type = IssueType.objects.get(id=category_id)
            issue_type.delete()
            return Response({"message": "Issue type deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except IssueType.DoesNotExist:
            return Response({"error": "Issue type not found."}, status=status.HTTP_404_NOT_FOUND)


class AIGenerateAPIView(APIView):
    """Proxies a text prompt to Gemini server-side. Replaces the frontend
    calling Google's Generative AI SDK directly with a hardcoded API key
    (AutoGenAI.jsx / ChatBot.jsx), which shipped a live, usable credential
    in the public JS bundle. The key now lives only in GEMINI_API_KEY on
    the server."""
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        prompt = request.data.get("prompt")
        if not prompt or not str(prompt).strip():
            return Response({"error": "prompt is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.GEMINI_API_KEY:
            return Response({"error": "AI generation is not configured."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            resp = requests.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                params={"key": settings.GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return Response({"text": text}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "AI generation failed. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)