from rest_framework import serializers
from .models import Ticket, SLATimer,PauseLogs
from .models import Ticket, Attachment
from .models import Ticket, Attachment,TicketComment,TicketCommentAttachment, WorkingHours, Holiday
from organisation_details.models import Organisation
from login_details.models import User
from services.models import IssueCategory, IssueType
from solution_groups.models import SolutionGroup
from roles_creation.models import UserRole

class AttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'file', 'uploaded_at']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file:
            url = obj.file.url  # make sure to access .url here
            return request.build_absolute_uri(url) if request else url
        return None
    
 
    
class TicketSerializer(serializers.ModelSerializer):
    service_domain = serializers.PrimaryKeyRelatedField(
        queryset=IssueCategory.objects.all(),
        error_messages={'does_not_exist': 'Service domain does not exist.'}
    )
    service_type = serializers.PrimaryKeyRelatedField(
        queryset=IssueType.objects.all(),
        error_messages={'does_not_exist': 'Service type does not exist.'}
    )

    assignee = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    assignee_role = serializers.SerializerMethodField()
 
    on_behalf_of = serializers.SlugRelatedField(
        queryset=User.objects.all(),
        slug_field='username',
        required=False,
        allow_null=True,
        error_messages={'error': 'User with this username does not exist.'}
    )
    
    developer_organization = serializers.SlugRelatedField(

        queryset=Organisation.objects.all(),

        slug_field='organisation_name',

        required=False,

        allow_null=True

    )
    
    ticket_organization = serializers.SlugRelatedField(

        queryset=Organisation.objects.all(),

        slug_field='organisation_id',

        required=False,

        allow_null=True

    )
    
    solution_grp = serializers.SlugRelatedField(

        queryset=SolutionGroup.objects.all(),

        slug_field='group_name',

        required=False,

        allow_null=True

    )
    project_owner_email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
 
 
    attachments = serializers.SerializerMethodField()
    # Expose remaining response time directly on the Ticket API
    remaining_response_time = serializers.SerializerMethodField(read_only=True)
    remaining_response_seconds = serializers.SerializerMethodField(read_only=True)
 
    class Meta:
        model = Ticket
        fields = "__all__"
        extra_kwargs = {
            'created_by': {'read_only': True},
            'modified_by': {'read_only': True},
        }

    def validate_assignee(self, value):
        if value and not User.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Assignee does not exist.")
        return value
    
    def get_assignee_role(self, obj):
        role = UserRole.objects.filter(user=obj.assignee, is_active=True).first()
        return role.role.name if role else None
 
    
    def get_attachments(self, obj):
            """Return full attachment objects using AttachmentSerializer."""
            request = self.context.get('request')
            return AttachmentSerializer(obj.attachments.all(), many=True, context={'request': request}).data

    def get_remaining_response_time(self, obj):
        """Return formatted remaining response time from related SLATimer (eg. '1h 20m 5s')."""
        try:
            sla = getattr(obj, 'sla_timers', None)
            if not sla:
                return None
            rem = sla.get_remaining_response_time()
            total = int(rem.total_seconds())
            h, r = divmod(total, 3600)
            m, s = divmod(r, 60)
            return f"{h}h {m}m {s}s"
        except Exception:
            return None

    def get_remaining_response_seconds(self, obj):
        """Return remaining response time in seconds for easy numeric checks on client side."""
        try:
            sla = getattr(obj, 'sla_timers', None)
            if not sla:
                return None
            rem = sla.get_remaining_response_time()
            return int(rem.total_seconds())
        except Exception:
            return None
    
    def to_representation(self, instance):
        """Customize serialized output to return human-readable labels."""
        representation = super().to_representation(instance)
 
        # Replace foreign key IDs with display names
        representation["service_domain"] = instance.service_domain.name if instance.service_domain else None
        representation["service_type"] = instance.service_type.name if instance.service_type else None
        representation["solution_grp"] = instance.solution_grp.group_name if instance.solution_grp else None
        representation["developer_organization"] = instance.developer_organization.organisation_name if instance.developer_organization else None
        representation["ticket_organization"] = instance.ticket_organization.organisation_id if instance.ticket_organization else None
        representation["assignee"] = instance.assignee.username if instance.assignee else None
        representation["created_by"] = instance.created_by.username if instance.created_by else None
        representation["on_behalf_of"] = instance.on_behalf_of.username if instance.on_behalf_of else None
        representation["modified_by"] = instance.modified_by.username if instance.modified_by else None
        representation["priority"] = instance.priority.urgency_name if instance.priority else None
        representation["project"] = instance.project.project_name if instance.project else None
 
        # Choice field display values
        representation["impact"] = instance.get_impact_display()
        representation["support_team"] = instance.get_support_team_display()
        representation["status"] = instance.get_status_display()
        if instance.assignee:
            is_dispatcher = UserRole.objects.filter(user=instance.assignee, role__name="Dispatcher", is_active=True).exists()
            representation["assignee"] = "Dispatcher" if is_dispatcher else instance.assignee.username
        else:
            representation["assignee"] = None
 
 
        return representation
    
    def create(self, validated_data):
        project = validated_data.get("project", None)
        if project:
            validated_data["project_owner_email"] = project.product_mail
        return super().create(validated_data)
   
 
 
    
class AssignTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ticket
        fields = ['assignee']

    def update(self, instance, validated_data):
        instance.assignee = validated_data.get('assignee', instance.assignee)
        instance.save()  # Just assign engineer, no status change, no SLA start
        return instance

class SLATimerSerializer(serializers.ModelSerializer):
    """Serializer for SLATimer model.

    Adds read-only fields that expose the dynamic remaining response time
    (what you asked: "how much of the response time is left").
    """
    remaining_response_time = serializers.SerializerMethodField(read_only=True)
    remaining_response_seconds = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SLATimer
        fields = "__all__"

    def get_remaining_response_time(self, obj):
        try:
            rem = obj.get_remaining_response_time()
            total = int(rem.total_seconds())
            h, r = divmod(total, 3600)
            m, s = divmod(r, 60)
            return f"{h}h {m}m {s}s"
        except Exception:
            return None

    def get_remaining_response_seconds(self, obj):
        try:
            rem = obj.get_remaining_response_time()
            return int(rem.total_seconds())
        except Exception:
            return None
        

class TicketCommentAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketCommentAttachment
        fields = ['id', 'file', 'uploaded_at']
 
class TicketCommentCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(), write_only=True, required=False
    )
 
    class Meta:
        model = TicketComment
        fields = ['ticket', 'comment', 'is_internal', 'attachments']
 
    def create(self, validated_data):
        attachments = validated_data.pop('attachments', [])
        comment = TicketComment.objects.create(**validated_data)
 
        TicketCommentAttachment.objects.bulk_create([
            TicketCommentAttachment(comment=comment, file=file) for file in attachments
        ])
        return comment
 
class TicketCommentListSerializer(serializers.ModelSerializer):
    attachments = TicketCommentAttachmentSerializer(many=True, read_only=True)
    created_by = serializers.StringRelatedField()
 
    class Meta:
        model = TicketComment
        fields = ['id', 'ticket', 'comment', 'is_internal', 'attachments', 'created_by', 'created_at']
 

class WorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingHours
        fields = "__all__"

class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"