from django.contrib import admin
from .models import Organisation, Employee

# Register your models here.
# admin.site.register(Organisation)
@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ("organisation_id", "organisation_name", "created_at", "modified_at","created_by","modified_by", "working_hours")  # Customize fields
    search_fields = ("organisation_name",)  # Enable search by name
    list_filter = ("created_at",)  # Add filtering options
    readonly_fields = ("created_at", "modified_at")  # Make timestamps read-only


def has_change_permission(self, request, obj=None):
        # Allow only superusers or specific roles to edit
        if request.user.is_superuser:
            return True  # Superuser can edit
        
        if hasattr(request.user, 'user_role') and request.user.user_role.role in ["Admin", "Developer"]:
            return True  # Only Admins and Managers can edit
        
        return False  # 


from .models import Employee
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("employee_id", "user_role", "organisation", "position_name", "level", "created_at", "modified_at","created_by","modified_by")
    search_fields = ("position_name",)
    list_filter = ("organisation", "level")