from django.contrib import admin

# Register your models here.
from .models import SolutionGroup,SolutionGroupTickets
# Register your models here.
@admin.register(SolutionGroup)
class SolutionGroupAdmin(admin.ModelAdmin):
    list_display = ("solution_id", "organisation","category","group_name", "created_at", "modified_at")  # Customize fields
    search_fields = ("group_name",)  
    list_filter = ("created_at",)  
    readonly_fields = ("created_at", "modified_at")  
admin.site.register(SolutionGroupTickets)
