from django.contrib import admin
from .models import Priority
# Register your models here.
@admin.register(Priority)
class PriorityAdmin(admin.ModelAdmin):
    list_display = ("priority_id", "urgency_name","description", "created_at", "modified_at",'response_target_time')  
    search_fields = ("urgency_name",)  
    list_filter = ("created_at",)  
    readonly_fields = ("created_at", "modified_at")  
