from django.contrib import admin
from .models import IssueCategory,IssueType

# Register your models here.
admin.site.register(IssueCategory)
admin.site.register(IssueType)