
from celery import shared_task
from .models import UserProfile
from login_details.models import User
 
@shared_task(bind=True, max_retries=3)
def create_user_profile_task(self, user_id, email, username):
    try:
        user = User.objects.get(id=user_id)
        # Avoid duplicate profile
        if not hasattr(user, 'userprofile'):
            UserProfile.objects.create(
                user=user,
                email=email,
                first_name=username,
                last_name='',
                phone_number='',
                address='',
                city='',
                state='',
                country=''
            )
    except Exception as e:
        self.retry(exc=e, countdown=10)