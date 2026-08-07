
from rest_framework import serializers
from .models import Organisation, Employee
from solution_groups.models import SolutionGroup,SolutionGroupTickets
from solution_groups.serializers import AssigneeTicketSerializer,SolutionSerializer,SolutionTicketSerializer
from roles_creation.models import UserRole

class SupportOrganisationSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    class Meta:
        model = Organisation
        fields = [
            'organisation_id', 'organisation_name', 'organisation_mail', 'is_active',
            'parent_organisation', 'created_at', 'modified_at', 'created_by', 'modified_by'
        ]
 
class OrganisationSerializer(serializers.ModelSerializer):
    support_organisations = SupportOrganisationSerializer(many=True, read_only=True)
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
 
    class Meta:
        model = Organisation
        fields = [
            'organisation_id', 'organisation_name', 'organisation_mail', 'is_active',
            'parent_organisation', 'created_at', 'modified_at', 'created_by', 'modified_by',
            'support_organisations', 'working_hours',
        ]

        extra_kwargs = {
            'working_hours': {'required': True, 'allow_null': True},
        }
      



class EmployeeSerializer(serializers.ModelSerializer):
    user_role = serializers.PrimaryKeyRelatedField(queryset=UserRole.objects.all())
    organisation = serializers.PrimaryKeyRelatedField(queryset=Organisation.objects.all())
    parent = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), allow_null=True, required=False)
    level = serializers.IntegerField()
    organisation_name = serializers.SerializerMethodField(read_only=True)
    username = serializers.SerializerMethodField(read_only=True)
    children = serializers.SerializerMethodField()
 
    class Meta:
        model = Employee
        fields = ['employee_id', 'username', 'organisation_name', 'user_role', 'organisation', 'position_name', 'level', 'parent', 'created_at', 'modified_at', 'created_by', 'modified_by', 'children']
        extra_kwargs = {
            'created_by': {'read_only': True},
            'modified_by': {'read_only': True},
        }
 
    def validate(self, data):
        """
        Add custom validation here, if necessary.
        """
        if 'parent' in data and data['parent'] == data.get('user_role'):
            raise serializers.ValidationError("An employee cannot be their own parent.")
        return data
 
    def get_organisation_name(self, obj):
        return obj.organisation.organisation_name if obj.organisation else None
 
    def get_username(self, obj):
        return obj.user_role.user.username if obj.user_role and obj.user_role.user else None
 
    def get_parent(self, obj):
        return obj.parent.employee_id if obj.parent else 0
 
    def get_children(self, obj):
        # Filter children by same organisation to avoid leakage
        children = obj.children.filter(organisation=obj.organisation)
        serializer = EmployeeSerializer(children, many=True)
        return serializer.data


class AssigneeSerializer(serializers.ModelSerializer):
    organisation_name = serializers.SerializerMethodField(read_only=True)
    username = serializers.SerializerMethodField(read_only=True)
    solutiongroup = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Employee
        fields = ['username', 'organisation_name','solutiongroup']
        extra_kwargs = {
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }

    def validate(self, data):
        """
        Add custom validation here, if necessary.
        """
        if 'parent' in data and data['parent'] == data.get('user_role'):
            raise serializers.ValidationError("An employee cannot be their own parent.")
        return data
    def get_organisation_name(self, obj):
        return obj.organisation.organisation_name if obj.organisation else None
    
    def get_username(self, obj):
        return obj.user_role.user.username if obj.user_role and obj.user_role.user else None
    def get_solutiongroup(self, obj):
        if not obj.organisation:
            return []
        
        tickets = SolutionGroupTickets.objects.filter(
            solution_group__organisation=obj.organisation
        )
        return AssigneeTicketSerializer(tickets, many=True).data