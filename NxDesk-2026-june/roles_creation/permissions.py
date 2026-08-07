

import logging
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied
from roles_creation.models import UserRole, RolePermission

logger = logging.getLogger(__name__)

class HasRolePermission(BasePermission):
    ACTION_PERMISSIONS = {
        "GET": "view",
        "POST": "create",
        "PUT": "update",
        "PATCH": "update",
        "DELETE": "delete",
    }

    def has_permission(self, request, required_permission: str):
        logger.info(f"🔍 Checking permissions for user: {request.user}")

        if not request.user or not request.user.is_authenticated:
            logger.warning("⛔ User is not authenticated!")
            return False

        print(required_permission)
        user_roles = UserRole.objects.filter(user=request.user).values_list('role__name', flat=True)
        print(user_roles)

        assigned_permissions = RolePermission.objects.filter(
            role__name__in=user_roles
        ).values_list('permission__name', flat=True)
        print(assigned_permissions)

        logger.info(f"🔍 Assigned permissions: {list(assigned_permissions)}")

        # Check if required permission exists
        if required_permission in assigned_permissions:
            logger.info(f"✅ Permission granted: {required_permission}")
            return True
        else:
            logger.warning(f"⛔ Permission denied: {required_permission}")
            raise PermissionDenied(detail=f"You do not have the '{required_permission}' permission.")



# import logging
# from rest_framework.permissions import BasePermission
# from rest_framework.exceptions import PermissionDenied
# from roles_creation.models import UserRole, RolePermission

# # logger = logging.getLogger(_name_)


# class HasRolePermission(BasePermission):
 
#     ACTION_PERMISSIONS = {
  
#         "GET": "view",
 
#         "POST": "create",
 
#         "PUT": "update",
 
#         "PATCH": "update",
 
#         "DELETE": "delete",
 
#     }
 
#     def has_permission(self, request, required_permission: str):
 
#         logger.info(f"🔍 Checking permissions for user: {request.user}")
 
#         if not request.user or not request.user.is_authenticated:
 
#             logger.warning("⛔ User is not authenticated!")
 
#             return False
 
#         # ✅ Superuser bypass
 
#         if request.user.is_superuser:
 
#             logger.info("👑 Superuser detected — granting all permissions.")
 
#             return True
 
#         print(required_permission)
 
#         user_roles = UserRole.objects.filter(user=request.user).values_list('role__name', flat=True)
 
#         print(user_roles)
 
#         assigned_permissions = RolePermission.objects.filter(
 
#             role_name_in=user_roles
 
#         ).values_list('permission__name', flat=True)
 
#         print(assigned_permissions)
 
#         logger.info(f"🔍 Assigned permissions: {list(assigned_permissions)}")
 
#         if required_permission in assigned_permissions:
 
#             logger.info(f"✅ Permission granted: {required_permission}")
 
#             return True
 
#         else:
 
#             logger.warning(f"⛔ Permission denied: {required_permission}")
 
#             raise PermissionDenied(detail=f"You do not have the '{required_permission}' permission.")


# class HasRolePermission(BasePermission):
#     def has_permission(self, request, view):
#         required_permission = getattr(view, "permission_required", None)

#         if not request.user or not request.user.is_authenticated:
#             return False

#         if request.user.is_superuser:
#             return True

#         user_roles = UserRole.objects.filter(user=request.user).values_list('role__name', flat=True)
#         assigned_permissions = RolePermission.objects.filter(
#             role_name_in=user_roles
#         ).values_list('permission__name', flat=True)

#         if required_permission in assigned_permissions:
#             return True

#         raise PermissionDenied(detail=f"You do not have the '{required_permission}' permission.")
