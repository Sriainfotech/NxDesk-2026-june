from rest_framework import serializers
from .models import ProjectsDetails,ProjectMember, ProjectAttachment
from roles_creation.models import UserRole
from login_details.models import User


class ProjectAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectAttachment
        fields = ['id', 'files', 'uploaded_at', 'uploaded_by']

class ProjectsSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    organisation = serializers.SlugRelatedField(read_only=True, slug_field='organisation_name')
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ProjectsDetails
        exclude = []  # or use `fields = '__all__'` if you're sure all fields are safe to expose


class ProjectsDashSerializer(serializers.ModelSerializer):
    org_name= serializers.SerializerMethodField()
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)
    class Meta:
        model = ProjectsDetails
     
        fields = '__all__'
        # extra_kwargs = {
        #     'created_by': {'read_only': True},  
        #     'modified_by': {'read_only': True},
        # }   
    def get_org_name(self, obj):
        return obj.organisation.organisation_name if obj.organisation else None
      
#

class ProjectsMembersSerializer(serializers.ModelSerializer):
    project_asignees = serializers.SerializerMethodField(read_only=True)
    project_name_display = serializers.SerializerMethodField(read_only=True)

    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')

    # These are for input only — we'll strip them out for output
    project_asignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), many=True, write_only=True)
    project_name = serializers.PrimaryKeyRelatedField(queryset=ProjectsDetails.objects.all(), write_only=True)

    class Meta:
        model = ProjectMember
        fields = [
            'project_asignee',      # write-only
            'project_name',         # write-only
            'project_asignees',     # read-only
            'project_name_display', # read-only
            'created_by',
            'modified_by',
            'created_at',
            'modified_at',
            'is_active',
            'assigned_project_id',
        ]
        extra_kwargs = {
            'created_by': {'read_only': True},
            'modified_by': {'read_only': True},
        }

    def get_project_asignees(self, obj):
        return [user.username for user in obj.project_asignee.all()]

    def get_project_name_display(self, obj):
        return obj.project_name.project_name if obj.project_name else None

    def to_representation(self, instance):
        """Customize output to exclude input fields and rename fields for clarity."""
        representation = super().to_representation(instance)
        # These were write-only, so they're safe to remove from output
        representation.pop('project_asignee', None)
        representation.pop('project_name', None)
        # Rename display field to 'project_name'
        representation['project_name'] = representation.pop('project_name_display', None)
        return representation
