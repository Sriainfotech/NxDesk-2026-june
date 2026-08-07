
from django.urls import path
from .views import RoleAPIView, PermissionAPIView, RolePermissionAPIView,UserRoleAPIView,UserRoleDetailAPIView,RoleDetailAPIView

urlpatterns = [
    path('create/', RoleAPIView.as_view(), name='role-list-create'),
    path('role/<int:role_id>/', RoleDetailAPIView.as_view(), name='role-update'),
    path('permissions/', PermissionAPIView.as_view(), name='permission-list-create'),
    path('permissions/<int:permission_id>/', PermissionAPIView.as_view(), name='permission-update'),
    path('assign-permissions/', RolePermissionAPIView.as_view(), name='assign-permissions'),
    path('assign-permissions/<int:role_permission_id>/', RolePermissionAPIView.as_view(), name='role-permissions'),
    path('user_role/',UserRoleAPIView.as_view(),name = 'user_role'),
    path('user_role/<int:user_role_id>/',UserRoleDetailAPIView.as_view(),name = 'user_role_detail')
]
 