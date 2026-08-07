 
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from login_details.models import User
from personal_details.models import UserProfile
from roles_creation.models import UserRole
from organisation_details.models import Employee
 
 
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        # Create the UserProfile when a new user is created
        user_profile = UserProfile.objects.create(
            user=instance,
            first_name=instance.first_name,
            last_name=instance.last_name,
            email=instance.email,
            # Auto-filling organisation and role from the user's roles and employee details
            created_by=instance,  # Set the creator as the user themselves (or modify as needed)
            modified_by=instance   # Similarly, you can set modified_by to the user or leave it as null initially
        )
       
        try:
            # Automatically fetch the user's role and organisation
            user_role = instance.user_roles.get(is_active=True)
            user_profile.role = user_role.role
            user_profile.organisation = user_role.employee.organisation
            user_profile.save()
 
        except (UserRole.DoesNotExist, Employee.DoesNotExist):
            pass  # Handle the case where the role or organisation is not found
 
    else:
        # Update the profile if the user is updated
        user_profile = UserProfile.objects.get(user=instance)
        user_profile.email = instance.email
        user_profile.first_name = instance.first_name
        user_profile.last_name = instance.last_name
        user_profile.save()
 