from django.db import models

# Create your models here.
from login_details.models import User

class IssueCategory(models.Model):
    issue_category_id = models.AutoField(primary_key=True)  # Auto-incrementing primary key
    name = models.CharField(max_length=100, unique=True)
    icon_url = models.ImageField(upload_to='category_icons/')  # Stores icon
    description = models.TextField(blank=True, null=True)  # Optional description field
    # icon = models.ImageField(upload_to='category_icons/')  # Stores icon
    is_active = models.BooleanField(default=True)  # Soft deletion flag
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="issuecategory_created")
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="issuecategory_updated")


    def __str__(self):
        return self.name

class IssueType(models.Model):
    issue_type_id = models.AutoField(primary_key=True)  # Auto-incrementing primary key
    category = models.ForeignKey(IssueCategory, on_delete=models.SET_NULL, null=True,blank=True,related_name='issue_types')
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)  # Optional description field
    icon_url = models.ImageField(upload_to='issue_type_icons/', blank=True, null=True)  # Optional icon field
    is_active = models.BooleanField(default=True)  # Soft deletion flag
    # icon = models.ImageField(upload_to='issue_type_icons/')  # Stores icon
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="issuetypes_created")
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="issuetypes_updated")

  

    class Meta:
        unique_together = ('category', 'name')  # Prevent duplicate types under the same category

    def __str__(self):
        return f"{self.category.name} - {self.name}"
