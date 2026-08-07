from django.db import models
# Create your models here.
from django.conf import settings
import random
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

from organisation_details.models import Employee, Organisation


class User(AbstractUser):
    """Custom User model with Role-Based Access Control (RBAC)"""
    id = models.AutoField(primary_key=True)
    is_customer = models.BooleanField(default=False)
    email = models.EmailField(unique=True)

    # Avoid related_name clash
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
    )
    # organization = models.ForeignKey(Organisation, on_delete=models.SET_NULL, null=True,related_name='org_name'  )

    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    
    comments = models.TextField(blank=True, null=True)  
    imported_by = models.CharField(max_length=255, blank=True, null=True)  # Allow null values
    imported_at = models.DateTimeField(auto_now_add=True)
    @property
    def organisation(self):
        try:
            user_role = self.user_roles.filter(is_active=True).first()
            if user_role:
                return user_role.employee.organisation
            return None
        except Employee.DoesNotExist:
            return None


class OTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.otp:
            self.otp = str(random.randint(100000, 999999))
        super().save(*args, **kwargs)

    def is_valid(self):
        expiration_time = self.created_at + timedelta(minutes=15)
        return not self.is_used and timezone.now() < expiration_time

    def __str__(self):
        return self.otp
      