
from django.db import models
from mptt.models import MPTTModel, TreeForeignKey
from django.core.exceptions import ValidationError
from roles_creation.models import UserRole

class Organisation(models.Model):
    organisation_id = models.BigAutoField(primary_key=True) 
    organisation_name = models.CharField(max_length=255,unique=True)  # Ensuring unique organisation name
    organisation_mail = models.EmailField(unique=True)  # Ensuring unique email
    working_hours=models.ForeignKey("timer.WorkingHours",on_delete=models.SET_NULL,null=True,blank=True)
    is_active = models.BooleanField(default=True)  # Soft deletion flag
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='organisations_created_by'
    )
    modified_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='organisations_modified_by'
    )
    parent_organisation = models.ForeignKey(
    'self',
    null=True,
    blank=True,
    on_delete=models.SET_NULL,
    related_name='support_organisations')

    class Meta:
        unique_together = ('organisation_name', 'organisation_mail')

    def __str__(self):
        return self.organisation_name
    def is_root(self):
        return self.parent_organisation is None






class Employee(MPTTModel):
    employee_id = models.BigAutoField(primary_key=True)  # Changed to BigAutoField for consistency
    user_role = models.OneToOneField(UserRole, on_delete=models.CASCADE, related_name='employee')
    is_active = models.BooleanField(default=True)  # Soft deletion flag
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name='employees')
    position_name = models.CharField(max_length=255)
    level = models.PositiveIntegerField()  # Prevents negative values automatically
    parent = TreeForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='employees_created_by'
    )
    modified_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='employees_modified_by'
    )

    class MPTTMeta:
        order_insertion_by = ['position_name']

    class Meta:
        unique_together = ('user_role', 'organisation')


    def clean(self):
        if self.parent and self.parent.organisation != self.organisation:
            raise ValidationError("Parent must be from the same organisation.")
 

    def clean(self):
        """ Validates Employee constraints before saving. """
        if self.pk is None and Employee.objects.filter(user_role=self.user_role, organisation=self.organisation).exists():
            raise ValidationError('This user is already assigned to the given organisation.')

        if self.parent == self:
            raise ValidationError("An employee cannot be their own supervisor.")

    def __str__(self):
        return f"{self.position_name} (Level {self.level})"
