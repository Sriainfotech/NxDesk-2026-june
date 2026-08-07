
from django.urls import path
from .views import RegisterUserAPIView,LoginUserAPIView,LogoutUserAPIView, OTPRequestAPIView, OTPVerifyAPIView,NewPasswordAPIView, BulkUserUploadAPIView, ChangePasswordAPIView,RegisterGetAPIVIEW


from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('api/register/', RegisterUserAPIView.as_view(), name='register'),
    path('api/assignee/',RegisterGetAPIVIEW.as_view(), name='get'),
    path('api/register/<int:id>/', RegisterGetAPIVIEW.as_view(), name='register-user-update-delete'),
    path('api/login/', LoginUserAPIView.as_view(), name='login'),
    path('api/logout/', LogoutUserAPIView.as_view(), name='logout'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('otp-request/', OTPRequestAPIView.as_view(), name='otp-request'),
    path('otp-verify/', OTPVerifyAPIView.as_view(), name='otp-verify'),
    path('newpassword/', NewPasswordAPIView.as_view(), name='newpassword'),
    path('resetpassword/', ChangePasswordAPIView.as_view(), name='resetpassword'),
    path("upload-users/", BulkUserUploadAPIView.as_view(), name="upload-users"),
]

  