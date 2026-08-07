from rest_framework import serializers
from .models import History, Reports, Attachment
from timer.models import Ticket

# class AttachmentSerializer(serializers.ModelSerializer):
#     file_url = serializers.SerializerMethodField()

#     class Meta:
#         model = Attachment
#         fields = ['id', 'file_url', 'uploaded_at', 'ticket']

#     def get_file_url(self, obj):
#         request = self.context.get('request')
#         if obj.file:
#             url = obj.file.url
#             return request.build_absolute_uri(url) if request else url
#         return None


class AttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    history_id = serializers.IntegerField(source='history.id', read_only=True)
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'file_url', 'file_name', 'uploaded_at', 'ticket', 'history_id']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            url = obj.file.url  # Cloudinary or media URL
            return request.build_absolute_uri(url) if request else url
        return None

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split('/')[-1]  # Just the file name, not full path
        return None

class TicketHistorySerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    
    class Meta:
        model = History
        fields = ['history_id', 'title', 'ticket', 'modified_at','created_by', 'modified_by']

class ReportSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    report_attachments = AttachmentSerializer(many=True, read_only=True)
    username = serializers.SerializerMethodField()
    title = serializers.CharField(required=False, allow_blank=True)
    ticket = serializers.CharField(required=True)  # Changed from ticket_id to match model field

    class Meta:
        model = Reports
        fields = [
            'report_id', 'title', 'created_by', 'modified_by',
            'created_at', 'modified_at',
            'attachments', 'report_attachments', 'username', 'ticket'
        ]

    def get_username(self, obj):
        return obj.modified_by.username if obj.modified_by else None

    def validate_attachments(self, value):
        for file in value:
            if file.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Each file must be less than 10MB.")
        return value
        
    def create(self, validated_data):
        attachments = validated_data.pop('attachments', [])
        
        # Handle empty title
        title = validated_data.get("title", "").strip()
        if not title:
            validated_data["title"] = "No Title"
        
        # Get ticket instance
        ticket_id = validated_data.get("ticket")
        if not ticket_id:
            raise serializers.ValidationError({"ticket": "This field is required."})
        
        try:
            ticket = Ticket.objects.get(ticket_id=ticket_id)
            validated_data["ticket"] = ticket
        except Ticket.DoesNotExist:
            raise serializers.ValidationError({"ticket": f"Ticket with ID {ticket_id} does not exist"})
        
        # Create report
        report = Reports.objects.create(**validated_data)
        
        # Create attachments
        for file in attachments:
            Attachment.objects.create(report=report, ticket=ticket, file=file)
            
        return report