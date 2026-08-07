from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext as _
from .models import Organisation
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_organisation_creation_email(organisation_name, organisation_email):
    try:
        # Retrieve the organisation for email content
        organisation = Organisation.objects.get(organisation_name=organisation_name)
        
        # Use f-string directly for the subject with translation
        subject = _("Organisation {organisation_name} Created Successfully").format(organisation_name=organisation.organisation_name)


        message = f"""
Dear Team,

    We are pleased to inform you that your organisation, {organisation_name}, has been successfully created in NxDesk.

    This marks the beginning of a seamless experience in managing your tickets, improving collaboration, and streamlining your processes.

    Here are your initial details for reference:
        - Organisation Name: {organisation_name}
        - Administrator Email: {organisation_email}

    If you have any questions or require assistance, our support team is here to help. Feel free to reach out to us at support@sriainfotech.com or visit our portal at https://sriainfotech.com/contact-us/.

    Thank you for choosing NxDesk. We look forward to being a valuable partner in your journey toward efficiency and growth.

Best Regards,
NxDesk Team
        """
        
        send_mail(
            subject,
            message,
            settings.EMAIL_HOST_USER,  # Sender Email
            [organisation_email],  # Receiver Email
            fail_silently=False
        )
        return f"Email sent to {organisation_email}"
    except Exception as e:
        return f"Failed to send email: {str(e)}"



