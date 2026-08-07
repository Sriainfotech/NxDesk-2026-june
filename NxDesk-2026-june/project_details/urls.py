from django.urls import path
from .views import ProjectDetailsAPI,UserProjectDetailsAPI,ProjectDashDetailsAPI,ProjectMemberAPI

urlpatterns = [
    path('details/', ProjectDetailsAPI.as_view(), name='details'),
    path('details/<int:project_id>/', ProjectDetailsAPI.as_view(), name='project_details_by_id'),
    path('user_project_details/', UserProjectDetailsAPI.as_view(), name='user_project_details'),
    path('projectdetails/', ProjectDashDetailsAPI.as_view(), name='projectdetails'),
    path('members/',ProjectMemberAPI.as_view(), name='project_members'),


    # path('personal_details/<int:id>/', UserProfileLView.as_view(), name='user_profile_by_id'),
    # path('profile_icon/<int:pk>/', UserProfileLView.as_view(), name='user-profile-summary'),
    # path('my_profile/', UserProfileLView.as_view(), name='current-user-profile'),
] 