from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from .models import Category
from .serializers import CategorySerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from roles_creation.permissions import HasRolePermission



import logging

logger = logging.getLogger(__name__)

class CategoryAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, id=None):
        """Handles GET requests for categories"""
        self.permission_required = "view_category"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)

        logger.info("CategoryList view was called")

        if id:
            try:
                category = Category.objects.get(pk=id)
                serializer = CategorySerializer(category)
                return Response(serializer.data)
            except Category.DoesNotExist:
                return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            categories = Category.objects.all()
            serializer = CategorySerializer(categories, many=True)
            return Response(serializer.data)

   
    def post(self, request, *args, **kwargs):
        """Handles POST requests for creating a category"""
        self.permission_required = "create_category"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        category_name = data.get('category_name')
        organisation = data.get('organisation')

        # Validate that category_name and organisation are provided
        if not category_name or not organisation:
            return Response(
                {"error": "Both category_name and organisation are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if the category already exists for the organization
        if Category.objects.filter(category_name=category_name, organisation=organisation).exists():
            return Response(
                {"category_name": "Category with this name already exists for the organization."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CategorySerializer(data=data)
        if serializer.is_valid():
            # Save the category with additional user info
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    def put(self, request, id=None):
        self.permission_required = "update_category"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        
        try:
            category = Category.objects.get(pk=id)
            serializer = CategorySerializer(category, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save(modified_by=request.user)
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)


    def delete(self, request, id=None):
        self.permission_required = "delete_category"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        
        try:
            category = Category.objects.get(pk=id)
            category.delete()
            return Response({"message": "Category deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)



from django.db.models import Q, Subquery, OuterRef
from rest_framework.decorators import api_view

@api_view(['GET'])
def search_categories(request):
    query = request.GET.get('q', '')
    subquery_param = request.GET.get('subquery', '')
    
    categories = Category.objects.all()

    if query:
        categories = categories.filter(
            Q(category_name__iexact=query) |
            Q(description__iexact=query) |
            Q(organisation__organisation_name__iexact=query) |
            Q(created_by__username__iexact=query) |
            Q(modified_by__username__iexact=query)
        )

    if subquery_param:
        subquery = Category.objects.filter(
            created_by=OuterRef('created_by'),
            category_name__iexact=subquery_param
        ).values('created_by')
        
        categories = categories.filter(
            created_by__in=Subquery(subquery)
        )

    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)