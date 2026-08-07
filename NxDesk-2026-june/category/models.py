from django.db import models
from organisation_details.models import Organisation  
from django.utils import timezone
from login_details.models import User
#import django_auditlog
#from django_auditlog.models import AuditlogHistoryField
class Category(models.Model):
    category_id = models.AutoField(primary_key=True)  # Primary Key with auto-increment
    category_name = models.CharField(max_length=50, null=False)  # Category Name, cannot be null
    description = models.TextField(blank=True, null=True) 
    is_active = models.BooleanField(default=True)
    organisation = models.ForeignKey(Organisation, on_delete=models.SET_NULL, null=True,related_name='organisation')  # ForeignKey to Organisation
    created_at=models.DateTimeField(auto_now_add=True)
    modified_at=models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='category_created', on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    modified_by = models.ForeignKey(User, related_name='category_modified', on_delete=models.SET_NULL, null=True, blank=True)
    #auditlog = AuditlogHistoryField()
    
    



    def __str__(self):
        return self.category_name
class Meta: 
        abstract = True 
class Meta:
        constraints = [
            models.UniqueConstraint(fields=['category_name', 'organisation'], name='unique_category_per_organisation')
        ]
class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['category_name', 'organisation'],
            name='unique_category_per_organisation'
        )
    ]
   
   