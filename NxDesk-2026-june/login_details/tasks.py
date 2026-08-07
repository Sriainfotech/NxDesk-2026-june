# yourapp/tasks.py

import pandas as pd
from celery import shared_task
from django.contrib.auth import get_user_model
from organisation_details.models import Organisation
from roles_creation.models import Role
from django.core.mail import send_mail
from django.db import IntegrityError
from django.conf import settings
# from django.contrib.auth import get_user_model
# User = get_user_model()
from django.contrib.auth import get_user_model

User = get_user_model()


# User = get_user_model()

@shared_task
def process_user_excel(file_path, uploaded_by):
    """Celery task to process the Excel file asynchronously."""
    df = pd.read_excel(file_path)

    new_users = []
    failed_records = []
    success_count = 0

    for _, row in df.iterrows():
        try:
            # Fetch Organisation and Role
            organisation = Organisation.objects.filter(name=row["Organisation"]).first()
            role = Role.objects.filter(name=row["Role"]).first()

            # Check if user already exists
            if User.objects.filter(username=row["Username"]).exists():
                failed_records.append({"username": row["Username"], "error": "User already exists"})
                continue

            # Create the user
            user = User(
                username=row["Username"],
                email=row["Email"],
                is_customer=row["Is Customer"],
                organisation=organisation,
                role=role,
                added_by=uploaded_by
            )
            user.set_password("defaultpassword")  # Set a default password
            new_users.append(user)
            success_count += 1

        except IntegrityError as e:
            failed_records.append({"username": row["Username"], "error": str(e)})
        except Exception as e:
            failed_records.append({"username": row.get("Username", "Unknown"), "error": str(e)})

    # Bulk insert new users
    User.objects.bulk_create(new_users)

    # Send email notification for each new user created
    for user in new_users:
        send_mail(
            "Your Account is Ready",
            f"Hello {user.username}, your account has been created. Your default password is 'defaultpassword'.",
            "teerdavenigedela@gmail.com",  # Replace with your admin email
            [user.email],
        )

    # Return summary of the operation
    return { 
        "success": success_count,
        "failed": len(failed_records),
        "failed_records": failed_records,
    }


@shared_task
def send_registration_email(user_id, raw_password):  # ✅ Accept two arguments
    try:
        user = User.objects.get(id=user_id)
        subject = "Welcome to Our Platform!"
        message = (
            f"Hello {user.first_name},\n\n"
            f"Thank you for registering with us. Here are your login credentials:\n\n"
            f"Username: {user.username}\n"
            f"Email: {user.email}\n"
            f"Password: {raw_password}\n\n"  # ✅ Include the generated password
            # "You can log in to your account here: https:///login\n\n"
            "Best regards,\n"
            "Your Support Team"
        )

        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
    except User.DoesNotExist:
        print(f"User with ID {user_id} not found.")
    except Exception as e:
        print(f"Error sending registration email: {str(e)}")



@shared_task
def send_password_update_email(user_email, username):
    subject = "Your Password Has Been Updated"
    message = f"Hello {username},\n\nYour password has been changed successfully. If you did not make this change, please contact support immediately."

    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,  # Ensure this is set in settings.py
        [user_email],
        fail_silently=False
    )


@shared_task
def send_password_update_email(user_email, username):
    subject = "Your Password Has Been Updated"
    message = f"Hello {username},\n\nYour password has been changed successfully. If you did not make this change, please contact support immediately."

    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,  # Ensure this is set in settings.py
        [user_email],
        fail_silently=False
    )


from celery import shared_task
import logging
from django.db import transaction
from roles_creation.models import UserRole, Role
from organisation_details.models import Employee, Organisation
from django.contrib.auth.models import User



logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def async_setup_user_related_records(user_id):
    """Create UserRole & Employee asynchronously after login."""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} does not exist.")
        return

    with transaction.atomic():
        user_role, created = UserRole.objects.get_or_create(
            user=user,
            defaults={
                'role': Role.objects.filter(name="Employee").first(),
                'is_active': True
            }
        )

        if created:
            logger.info(f"Created UserRole for user {user.email}")

        if not Employee.objects.filter(user_role=user_role).exists():
            default_org = Organisation.objects.first()
            if not default_org:
                logger.error("No organisation found. Please create one.")
                return

            Employee.objects.create(
                user_role=user_role,
                organisation=default_org
            )
            logger.info(f"Created Employee record for {user.email}")




# from django.core.mail import EmailMultiAlternatives
# from django.template.loader import render_to_string
# from django.conf import settings
# from celery import shared_task
# from django.contrib.auth import get_user_model
# from django.utils import timezone

# User = get_user_model()

# @shared_task
# def send_registration_email(user_id, raw_password):
#     try:
#         user = User.objects.get(id=user_id)
        
#         # Email subject
#         subject = "Welcome to TicketFlow - Your Account is Ready!"
        
#         # Context data for templates
#         context = {
#             'user': user,
#             'first_name': user.first_name or 'User',
#             'last_name': user.last_name or '',
#             'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,
#             'email': user.email,
#             'username': user.username,
#             'temporary_password': raw_password,
#             'login_url': f"{settings.SITE_URL}/login" if hasattr(settings, 'SITE_URL') else 'https://yourdomain.com/login',
#             'dashboard_url': f"{settings.SITE_URL}/dashboard" if hasattr(settings, 'SITE_URL') else 'https://yourdomain.com/dashboard',
#             'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@yourdomain.com'),
#             'company_name': getattr(settings, 'COMPANY_NAME', 'TicketFlow'),
#             'company_phone': getattr(settings, 'COMPANY_PHONE', '+1-800-TICKETS'),
#             'company_website': getattr(settings, 'SITE_URL', 'https://yourdomain.com'),
#             'current_year': timezone.now().year,
#             'platform_name': 'TicketFlow Support System',
#         }
        
#         # Render HTML and Plain Text versions
#         html_content = render_to_string('templates/emails/registration.html', context)
#         plain_text_content = render_to_string('emails/registration.txt', context)
        
#         # Create and send email
#         email = EmailMultiAlternatives(
#             subject=subject,
#             body=plain_text_content,
#             from_email=f"{context['company_name']} <{settings.EMAIL_HOST_USER}>",
#             to=[user.email],
#             reply_to=[context['support_email']],
#         )
        
#         # Attach HTML version
#         email.attach_alternative(html_content, "text/html")
        
#         # Send email
#         email.send(fail_silently=False)
        
#         print(f"Registration email sent successfully to {user.email}")
#         return True
        
#     except User.DoesNotExist:
#         error_msg = f"User with ID {user_id} not found."
#         print(error_msg)
#         return False
        
#     except Exception as e:
#         error_msg = f"Error sending registration email to user {user_id}: {str(e)}"
#         print(error_msg)
#         # You might want to log this to your logging system
#         # logger.error(error_msg)
#         return False


# @shared_task
# def send_password_reset_email(user_id, reset_token):
#     """Send password reset email for existing users"""
#     try:
#         user = User.objects.get(id=user_id)
        
#         subject = "Password Reset Request - TicketFlow"
        
#         context = {
#             'user': user,
#             'first_name': user.first_name or 'User',
#             'reset_url': f"{getattr(settings, 'SITE_URL', 'https://yourdomain.com')}/reset-password/{reset_token}",
#             'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@yourdomain.com'),
#             'company_name': getattr(settings, 'COMPANY_NAME', 'TicketFlow'),
#             'current_year': timezone.now().year,
#         }
        
#         html_content = render_to_string('emails/password_reset.html', context)
#         plain_text_content = render_to_string('emails/password_reset.txt', context)
        
#         email = EmailMultiAlternatives(
#             subject=subject,
#             body=plain_text_content,
#             from_email=f"{context['company_name']} <{settings.EMAIL_HOST_USER}>",
#             to=[user.email],
#             reply_to=[context['support_email']],
#         )
        
#         email.attach_alternative(html_content, "text/html")
#         email.send(fail_silently=False)
        
#         print(f"Password reset email sent successfully to {user.email}")
#         return True
        
#     except Exception as e:
#         error_msg = f"Error sending password reset email: {str(e)}"
#         print(error_msg)
#         return False