from django.urls import path
from .views import autoAssigneeAPIView,OrganisationAPI, EmployeeAPI,TreeEmployeeAPI, SuperAdminHierarchyView

urlpatterns = [
    path('autoAssignee/', autoAssigneeAPIView.as_view(), name='dispatcher'),

    path('organisation/', OrganisationAPI.as_view(), name='organisation-list'),
    path('organisation/<int:organisation_id>/', OrganisationAPI.as_view(), name='organisation-detail'),
    path("employee/", EmployeeAPI.as_view(), name="employee-list-create"),
    path("employeetree/", TreeEmployeeAPI.as_view(), name="employeetree"),
    path("employee/<int:employee_id>/", EmployeeAPI.as_view(), name="employee-detail"),
    path("organisation/<int:organisation_id>/employee/", EmployeeAPI.as_view(), name="organisation-employee-list"),
    path("superadmin-hierarchy/", SuperAdminHierarchyView.as_view(), name="superadmin-hierarchy"),
]