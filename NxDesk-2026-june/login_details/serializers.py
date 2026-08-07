   
from rest_framework import serializers
# from .models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from .models import User
from django.contrib.auth.hashers import check_password
import re


class RegistrationUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email",'id']
       
 
    def validate_email(self, value):
        """Ensure email format is correct."""
        import re
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, value):
            raise serializers.ValidationError("Invalid email format. Please enter a valid email.")
        return value
 
    def create(self, validated_data):
        """Create and return a new user instance."""
        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data["email"]
        )
        return user 



class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    # username = serializers.CharField()
    password = serializers.CharField()
    def validate_email(self, value):
        """Ensure email format is correct."""
        import re
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, value):
            raise serializers.ValidationError("Invalid email format. Please enter a valid email.")
        return value
 


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

class NewPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    email = serializers.EmailField()

def check_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

 
# class ChangePasswordSerializer(serializers.Serializer):
#     old_password = serializers.CharField(required=True)
#     new_password = serializers.CharField(required=True)
 
#     def validate_old_password(self, value):
#         user = self.context['request'].user
#         if not user.is_authenticated:
#             raise serializers.ValidationError("User is not authenticated.")
 
#         if not user.check_password(value):
#             raise serializers.ValidationError("Old password is incorrect.")
#         return value
    
#     def validate_new_password(self, value):           #added
#          if len(value) < 8:
#              raise serializers.ValidationError("Password must be at least 8 characters long.")
#          return value
 
#     def save(self, **kwargs):
#             """Update user password."""
#             user = self.context["request"].user
#             user.set_password(self.validated_data["new_password"])
#             user.save()
 
 
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user

        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def save(self, **kwargs):
        """Update user password."""
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()








   


