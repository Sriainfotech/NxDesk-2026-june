from django.urls import path
from .views import UserProfileView

urlpatterns = [
    path('personal_details/', UserProfileView.as_view(), name='personal-details-list-create'),
    path('personal_details/<int:id>/', UserProfileView.as_view(), name='user_profile_by_id'),
    path('profile_icon/<int:pk>/', UserProfileView.as_view(), name='user-profile-summary'),
    path('my_profile/', UserProfileView.as_view(), name='current-user-profile'),
]


