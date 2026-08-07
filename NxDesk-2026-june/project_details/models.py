
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from django.core.exceptions import ValidationError
from roles_creation.models import UserRole
from django.db import models

class ProjectsDetails(models.Model):
    project_id = models.BigAutoField(primary_key=True)
    project_name = models.CharField(max_length=255)
    organisation = models.ForeignKey(
        'organisation_details.Organisation', on_delete=models.SET_NULL, null=True, related_name='project_organisation'
    )
    product_mail = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='project_created_by'
    )
    modified_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='project_modified_by'
    )

    class Meta:
        unique_together = ('project_name', 'product_mail')

    def __str__(self):
        return self.project_name
 

class ProjectAttachment(models.Model):
    project = models.ForeignKey(ProjectsDetails, on_delete=models.CASCADE, related_name='attachments')
    files = models.FileField(upload_to='attachments/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='uploaded_by'
    )


  
class ProjectMember(models.Model):
    project_asignee = models.ManyToManyField("login_details.User", related_name='project_engineers')
    assigned_project_id = models.BigAutoField(primary_key=True)
    organisation = models.ForeignKey("organisation_details.Organisation", on_delete=models.SET_NULL, null=True, related_name='project_member_organisation')
    project_name = models.ForeignKey(ProjectsDetails, on_delete=models.CASCADE, related_name='projects')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('login_details.User', on_delete=models.SET_NULL, null=True, related_name='projectid_created_by')
    modified_by = models.ForeignKey('login_details.User', on_delete=models.SET_NULL, null=True, related_name='projectid_modified_by')

