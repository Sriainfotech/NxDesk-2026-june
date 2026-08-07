


from rest_framework import serializers
from .models import UserProfile
from rest_framework.exceptions import ValidationError
from project_details.models import ProjectMember
from roles_creation.models import UserRole
# from project_details.serializers import ProjectsMemberSerializer
 
class UserProfileSerializer(serializers.ModelSerializer):
    organisation_name = serializers.SerializerMethodField()
    organisation_id = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    username = serializers.SerializerMethodField()
    assigned_projects = serializers.SerializerMethodField()
    profile_pic_url = serializers.SerializerMethodField()
    email = serializers.ReadOnlyField(source="user.email")
    created_by = serializers.ReadOnlyField(source="created_by.id")
    modified_by = serializers.ReadOnlyField(source="modified_by.id")
    employee_id = serializers.SerializerMethodField()
    is_superuser = serializers.SerializerMethodField()
 
   
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'email', 'phone_number',
            'address', 'city', 'state', 'country', 'department', 'date_of_birth',
            'profile_pic', 'created_at', 'modified_at', 'assigned_projects', 'created_by', 'modified_by',
            'profile_pic_url', 'organisation_name', 'role', 'username', 'employee_id','personal_id', 'organisation_id','is_superuser']
        read_only_fields = ['user']
        # Make these fields optional
        extra_kwargs = {
            'phone_number': {'required': False},
            'address': {'required': False},
            'city': {'required': False},
            'state': {'required': False},
            'country': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False}
        }
 
    def get_organisation_name(self, obj):
        if obj.organisation:
            return obj.organisation.organisation_name
        return None
    

    def get_organisation_id(self, obj):
        return obj.organisation.organisation_id if obj.organisation else None

    def get_role(self, obj):
        try:
            user_role = obj.user.user_roles.filter(is_active=True).first()  # Fetch the active role for the user
            if user_role:
                return user_role.role.name  # Adjust 'name' if it's the actual field name in your Role model
        except UserRole.DoesNotExist:
            return None
        return None
 
    def get_username(self, obj):
        if obj.user:
            return obj.user.username
        return None
   
 
    def get_assigned_projects(self, obj):
        # Here we manually prepare assigned_projects with only project_name
        assigned_projects = ProjectMember.objects.filter(project_asignee=obj.user)
        return [{"project_name": project.project_name.project_name} for project in assigned_projects]
   
    def get_profile_pic_url(self, obj):
        return obj.profile_pic.url if obj.profile_pic else None
 
    def create(self, validated_data):
        # Check if user already has a profile
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if UserProfile.objects.filter(user=request.user).exists():
                raise ValidationError("A profile for this user already exists.")
            validated_data['user'] = request.user
        return super().create(validated_data)
 
    def update(self, instance, validated_data):
        # This method is called when updating the profile
        request = self.context.get('request')
       
        # Do not override the user during updates
        if 'user' in validated_data:
            del validated_data['user']
           
        # Update only the provided fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
           
        instance.save()
        return instance
    
    def get_employee_id(self, obj):
        try:
            return obj.user.user_roles.first().employee.employee_id
        except:
            return None

    def get_is_superuser(self, obj):
        if obj.user:
            return obj.user.is_superuser
        return False