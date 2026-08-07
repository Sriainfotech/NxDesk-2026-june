from rest_framework.exceptions import NotFound, ValidationError
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .models import Role, Permission, RolePermission, UserRole
from .serializers import RoleSerializer, PermissionSerializer, RolePermissionSerializer, UserRoleSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from roles_creation.permissions import HasRolePermission
from django.core.exceptions import ObjectDoesNotExist
User = get_user_model()
from .permissions import HasRolePermission
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound, ValidationError, PermissionDenied

class RoleAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    
    def get(self, request):
        """ Handle GET requests to fetch all roles """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "view_roles")
            roles = Role.objects.all()
            if not roles:
                raise NotFound("No roles found.")
            serializer = RoleSerializer(roles, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):

        """ Handle POST requests to create a new role """

        self.permission_required = "create_roles"

        if not HasRolePermission().has_permission(request, self.permission_required):

            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
    
        try:

            # Normalize name to avoid case and space issues

            data = request.data.copy()

            data['name'] = data.get('name', '').strip()
    
            serializer = RoleSerializer(data=data)

            if serializer.is_valid():

                serializer.save(created_by=request.user)

                return Response(serializer.data, status=status.HTTP_201_CREATED)
    
            raise ValidationError(serializer.errors)
    
        except ValidationError as e:

            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        except IntegrityError as e:

            return Response({"error": f"Integrity Error: {str(e)}"}, status=status.HTTP_409_CONFLICT)

        except Exception as e:

            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
class RoleDetailAPIView(APIView):
    def get(self, request, pk):
        """ Handle GET requests to  fetch a specific role """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "view_roles")
            role = get_object_or_404(Role, pk=pk)
            serializer = RoleSerializer(role)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, role_id):
        """ Handle PUT requests to update an existing role """
        self.permission_required = "update_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "update_roles")
            role = get_object_or_404(Role, pk=role_id)
            serializer = RoleSerializer(role, data=request.data, partial=True)
            if serializer.is_valid():
                # Check for duplicate roles based on some field
                if Role.objects.filter(name=request.data.get('name')).exclude(pk=role_id).exists():
                    raise ValidationError("A role with this name already exists.")
                serializer.save(modified_by=request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            raise ValidationError(serializer.errors)
        except ValidationError as e:
            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except ObjectDoesNotExist as e:
            return Response({"error": f"Role not found: {str(e)}"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, role_id):
        """ Handle DELETE requests to remove a role """
        self.permission_required = "delete_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "delete_roles")
            role = get_object_or_404(Role, pk=role_id)
            role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Role.DoesNotExist:
            return Response({"error": "Role not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PermissionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]    

    def get(self, request):
        """ Handle GET requests to fetch all permissions """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            permissions = Permission.objects.all()
            if not permissions:
                raise NotFound("No permissions found.")
            serializer = PermissionSerializer(permissions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @admin_required
    def post(self, request):
        """ Handle POST requests to create a new permission """
        self.permission_required = "create_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            serializer = PermissionSerializer(data=request.data)
            if serializer.is_valid():
                # Check for duplicate permissions based on the name
                if Permission.objects.filter(name=request.data.get('name')).exists():
                    raise ValidationError("A permission with this name already exists.")
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            raise ValidationError(serializer.errors)
        except ValidationError as e:
            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except IntegrityError as e:
            return Response({"error": f"Integrity Error: {str(e)}"}, status=status.HTTP_409_CONFLICT)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @admin_required
    def put(self, request, pk):
        """ Handle PUT requests to update an existing permission """
        self.permission_required = "update_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            permission = get_object_or_404(Permission, pk=pk)
            serializer = PermissionSerializer(permission, data=request.data, partial=True)
            if serializer.is_valid():
                # Check for duplicate permissions based on name
                if Permission.objects.filter(name=request.data.get('name')).exclude(pk=pk).exists():
                    raise ValidationError("A permission with this name already exists.")
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            raise ValidationError(serializer.errors)
        except ValidationError as e:
            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Permission.DoesNotExist:
            return Response({"error": "Permission not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # @admin_required
    def delete(self, request, pk):
        """ Handle DELETE requests to remove a permission """
        self.permission_required = "delete_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            permission = get_object_or_404(Permission, pk=pk)
            permission.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Permission.DoesNotExist:
            return Response({"error": "Permission not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
 
class RolePermissionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]    

    def get(self, request):
        """ Handle GET requests to fetch all role-permission associations """ 
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            role_permissions = RolePermission.objects.all()
            if not role_permissions:
                raise NotFound("No role-permission associations found.")
            serializer = RolePermissionSerializer(role_permissions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
                return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    
    def post(self, request, *args, **kwargs):
        self.permission_required = "create_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = RolePermissionSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   
    def put(self, request, role_permission_id):
        self.permission_required = "update_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            role_permission = get_object_or_404(RolePermission, pk=role_permission_id)
            serializer = RolePermissionSerializer(role_permission, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            raise ValidationError(serializer.errors)
        except ValidationError as e:
            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, role_permission_id):
        """ Handle GET requests to fetch a specific role-permission association """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "view_permissions")
            role_permission = get_object_or_404(RolePermission, pk=role_permission_id)
            serializer = RolePermissionSerializer(role_permission)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RolePermission.DoesNotExist:
            return Response({"error": "Role-Permission association not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    # @admin_required
    def delete(self, request, role_permission_id):
        """ Handle DELETE requests to remove a role-permission association """
        self.permission_required = "dlete_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "remove_permissions_from_roles")
            role_permission = get_object_or_404(RolePermission, pk=role_permission_id)
            role_permission.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except RolePermission.DoesNotExist:
            return Response({"error": "Role-Permission association not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserRoleAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def check_permission(self, request, permission_required):
        """ Check if the user has the required permission """
        if not HasRolePermission().has_permission(request, permission_required):
            return Response({'error': 'Permission denied.'}, status=403)

    def get(self, request):     
        """ Handle GET requests to fetch all user-role associations """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            user_roles = UserRole.objects.all()
            if not user_roles:
                raise NotFound("No user-role associations found.")
            serializer = UserRoleSerializer(user_roles, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    def post(self, request):
        """Assign a role to a user."""
        self.permission_required = "create_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            # ✅ Expecting: {"user": 1, "role": 2}
            serializer = UserRoleSerializer(data=request.data)
            if serializer.is_valid():
                # ✅ Check for duplicate
                if UserRole.objects.filter(user=request.data['user'], role=request.data['role']).exists():
                    return Response({'error': 'This role is already assigned to the user.'}, status=status.HTTP_400_BAD_REQUEST)

                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class UserRoleDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]  
    authentication_classes = [JWTAuthentication]
    def put(self, request,user_role_id):
        """ Handle PUT requests to update a user-role association """
        self.permission_required = "update_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):   
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "update_roles")
            user_role = get_object_or_404(UserRole, pk=user_role)
            serializer = UserRoleSerializer(user_role, data=request.data, partial=True)
            if serializer.is_valid():
                # Validate if the user already has the role
                if UserRole.objects.filter(user=request.data['user'], role=request.data['role']).exclude(pk=user_role_id).exists():
                    raise ValidationError("This role is already assigned to the user.")
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            raise ValidationError(serializer.errors)
        except ValidationError as e:
            return Response({"error": f"Validation failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    def get(self, request, user_role_id):
        """ Handle GET requests to fetch a specific user-role association """
        self.permission_required = "view_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "view_roles")
            user_role = get_object_or_404(UserRole, pk=user_role_id)
            serializer = UserRoleSerializer(user_role)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except UserRole.DoesNotExist:
            return Response({"error": "User-Role association not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    def delete(self, request, user_role_id):
        """ Handle DELETE requests to remove a user-role association """
        self.permission_required = "delete_roles"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            # self.check_permission(request, "remove_roles_from_users")
            user_role = get_object_or_404(UserRole, pk=user_role_id)
            user_role.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserRole.DoesNotExist:
            return Response({"error": "User-Role association not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)