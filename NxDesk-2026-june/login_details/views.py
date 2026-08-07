
from django.shortcuts import render

# Create your views here.
from rest_framework import status
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from .models import OTP, User
from .serializers import RegistrationUserSerializer, LoginSerializer, OTPRequestSerializer, OTPVerifySerializer,NewPasswordSerializer 
from Ticketing_tool.settings import EMAIL_HOST_USER
from django.core.mail import EmailMessage
from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
#from .models import PasswordResetToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from roles_creation.permissions import HasRolePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
import random
import string
from .tasks import send_registration_email
from django.contrib.auth import update_session_auth_hash
from .serializers import ChangePasswordSerializer
from .tasks import async_setup_user_related_records 
import logging
from django.contrib.auth import get_user_model
logger = logging.getLogger(__name__)
User = get_user_model()
from rest_framework.parsers import MultiPartParser
from login_details.tasks import process_user_excel
from django.http import JsonResponse
from rest_framework_simplejwt.authentication import JWTAuthentication

import os
import tempfile


class RegisterUserAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
 
 
    def post(self, request):
        self.permission_required = "create_users"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)

        serializer = RegistrationUserSerializer(data=request.data)
 
        if serializer.is_valid():
            user = serializer.save()
 
            raw_password = "".join(random.choices(string.ascii_letters + string.digits, k=10))
            user.set_password(raw_password)
            user.save()
 
            send_registration_email.delay(user.id, raw_password)
 
            return Response(
                {"message": "User registered successfully. Check your email for login credentials."},
                status=status.HTTP_201_CREATED,
            )
 
        print("Errors:", serializer.errors)  # Debugging validation errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  


class RegisterGetAPIVIEW(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def get(self, request, *args, **kwargs):
        self.permission_required = "view_users"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)

        register = User.objects.all()
        serializer = RegistrationUserSerializer(register, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, *args, **kwargs):
        self.permission_required = "update_users"
        HasRolePermission.has_permission(self,request,view=self.permission_required)
        user_id = kwargs.get("id")  # Extract the id from the URL
        user = get_object_or_404(User, id=user_id)  
        
        serializer = RegistrationUserSerializer(user, data=request.data, partial=True)  # Allow partial updates
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
            self.permission_required = "delete_users"
            HasRolePermission.has_permission(self,request,view=self.permission_required) 
            user_id = kwargs.get("id")  # Assuming you pass user ID in the URL
            user = get_object_or_404(User, id=user_id)
            user.delete()
            return Response({"message": "User deleted successfully."}, status=status.HTTP_204_NO_CONTENT)

@method_decorator(csrf_exempt, name='dispatch')



class LoginUserAPIView(APIView):
    permission_classes = [AllowAny]
    """Handles user login with proper validation, authentication, and error handling."""

   
    def post(self, request):
        try:
            email = request.data.get("email")
            password = request.data.get("password")
 
            if not email:
                logger.warning("Login attempt failed: Email is required.")
                return Response(
                    {"error": "Email is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
 
            if not password:
                logger.warning("Login attempt failed: Password is required.")
                return Response(
                    {"error": "Password is required."},
                    status=status.HTTP_400_BAD_REQUEST
                )
 
            # Optional: validate email format
            from django.core.validators import validate_email
            from django.core.exceptions import ValidationError
 
            try:
                validate_email(email)
            except ValidationError:
                logger.warning(f"Login attempt failed: Invalid email format '{email}'.")
                return Response(
                    {"error": "Please enter a valid email address."},
                    status=status.HTTP_400_BAD_REQUEST
                )
 
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning(f"Login failed: Email '{email}' not found.")
                return Response(
                    {"error": "Invalid email."},
                    status=status.HTTP_404_NOT_FOUND
                )
 
            user = authenticate(username=user_obj.username, password=password)
 
            if user is None:
                logger.warning(f"Login failed: Invalid password for user '{email}'.")
                return Response(
                    {"error": "Invalid password."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
 
            if not user.is_active:
                logger.warning(f"Login failed: Inactive user '{email}'.")
                return Response(
                    {"error": "Account is disabled. Please contact support."},
                    status=status.HTTP_403_FORBIDDEN
                )
 
            refresh = RefreshToken.for_user(user)
 
            # Optional: trigger background task
            async_setup_user_related_records.delay(user.id)
 
            logger.info(f"Login successful for user '{email}'.")
 
            return Response(
                {
                    "message": "Login successful.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK,
            )
 
        except Exception as e:
            logger.error(f"Unexpected error during login: {str(e)}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
 
 
 

from rest_framework.permissions import IsAuthenticated 

class SomeProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "You have access!"})

class LogoutUserAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        logout(request)
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)



class OTPRequestAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.filter(email=email).first()
            
            if user:
                OTP.objects.filter(user=user, is_used=False).update(is_used=True)
                otp_num = OTP.objects.create(user=user)
                
                subject = "Your OTP Code"
                message = f"Use the following OTP to login: {otp_num.otp}\n\nThis code is valid for 15 minutes."
                send_mail(subject, message, EMAIL_HOST_USER, [user.email])
                
                return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)
            # else:
            #     return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"error": "Invalid email. Please enter a valid email."}, status=status.HTTP_400_BAD_REQUEST)




class OTPVerifyAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        otp_input = request.data.get('otp')
        if not email or not otp_input:
            return Response({'error': ' OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(email=email).first()

            if not user:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            otp_record = OTP.objects.filter(user=user, otp=otp_input, is_used=False).first()

            if not otp_record:
                return Response({'error': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)
            if otp_record.is_valid():
                otp_record.is_used = True
                otp_record.save()
                return Response({'message': 'OTP verified successfully.'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'OTP has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NewPasswordAPIView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        if not email or not new_password:
            return Response({'error': ' new password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.filter(email=email).first()

            if not user:
                return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
            user.password = make_password(new_password)
            user.save()

            return Response({'message': 'Password reset successfully. Redirecting to login...'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



from .tasks import send_password_update_email

@method_decorator(csrf_exempt, name='dispatch')
class ChangePasswordAPIView(APIView):
    

    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

        if not request.data.get("old_password") or not request.data.get("new_password"):
            return Response({"error": "Both old and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']

            # Set new password
            user.set_password(new_password)
            user.save()

            # Keep user logged in after password change
            update_session_auth_hash(request, user)


            # Send password update email asynchronously
            send_password_update_email.delay(user.email, user.username)

            # self.send_password_update_email(user)
            # send_password_update_email.delay(user.email, user.username)
            return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response({"error":"Invalid old password"}, status=status.HTTP_400_BAD_REQUEST)

# @method_decorator(csrf_exempt, name='dispatch')
# class ChangePasswordAPIView(APIView):
#     permission_classes = [IsAuthenticated]
#     authentication_classes = [JWTAuthentication]

#     def post(self, request):
#         serializer = ChangePasswordSerializer(data=request.data, context={'request': request})

#         if serializer.is_valid():
#             user = request.user
#             new_password = serializer.validated_data['new_password']

#             # Set new password
#             user.set_password(new_password)
#             user.save()

#             # Keep user logged in after password change
#             update_session_auth_hash(request, user)

#             # Send password update email asynchronously
#             send_password_update_email.delay(user.email, user.username)

#             return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)

#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BulkUserUploadAPIView(APIView):
    parser_classes = (MultiPartParser,)
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]


    def post(self, request, *args, **kwargs):
        """Handles bulk user uploads via an Excel file."""

        # Role-based validation: Check if the user has an Admin role
        user_role = request.user.role  # Assuming the user has a 'role' field
        if not user_role or user_role.role_name != "Admin":
            self.send_access_denied_email(request.user)
            return JsonResponse(
                {"error": "You do not have the necessary permissions to upload users."},
                status=403,
            )

        # Ensure a file is uploaded
        file = request.FILES.get("file")
        if not file:
            return JsonResponse({"error": "No file uploaded. Please upload a file."}, status=400)

        # ✅ Get a valid temporary directory path for all OS
        temp_dir = tempfile.gettempdir()  
        file_path = os.path.join(temp_dir, file.name)

        # ✅ Save the uploaded file temporarily
        with open(file_path, "wb") as f:
            for chunk in file.chunks():
                f.write(chunk)

        # ✅ Call Celery task to process the file asynchronously
        process_user_excel.delay(file_path, request.user.username)

        return Response({"message": "File is being processed in the background!"}, status=202)



    def send_access_denied_email(self, user):
        """Send email to admins when a non-Admin user attempts to upload data."""
        
        # Get the list of admin users
        admin_users = User.objects.filter(role__role_name="Admin")

        for admin in admin_users:
            send_mail(
                "Unauthorized Access Attempt",
                f"User {user.username} (Role: {user.role.role_name}) attempted to upload bulk data, but does not have Admin permissions.",
                settings.EMAIL_HOST_USER,  # Replace with your "from" email
                [admin.email],  # Send email to all admins
            )

