from django.contrib import admin
from .models import ProjectsDetails,ProjectMember,ProjectAttachment

# Register your models here.
admin.site.register(ProjectsDetails)
admin.site.register(ProjectMember)
admin.site.register(ProjectAttachment)
