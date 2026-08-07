
from timer.serializers import TicketSerializer
from rest_framework import serializers
from .models import SolutionGroup,SolutionGroupTickets
from django.contrib.auth import get_user_model

User = get_user_model()

class SolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolutionGroup
        fields = '__all__'
        extra_kwargs = {
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }

    def to_representation(self, instance):
        """Customize serialized output to return human-readable labels."""
        representation = super().to_representation(instance)
        representation["organisation"] = instance.organisation.organisation_name if instance.organisation else None
        representation["category"] = instance.category.category_name if instance.category else None
        representation["created_by"] = instance.created_by.username if instance.created_by else None
        representation["modified_by"] = instance.modified_by.username if instance.modified_by else None
        return representation

    def validate(self, attrs):
        # Ensure no user fields are injected by the client
        attrs.pop('created_by', None)
        attrs.pop('modified_by', None)
        return super().validate(attrs)
    
    
class SolutionTicketSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    solution_group_name = serializers.SerializerMethodField()
    class Meta:
        model = SolutionGroupTickets
        fields = ['solution_group_name','username','ticket_id']
        extra_kwargs = {
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }
    def get_username(self, obj):
        return obj.user.username if obj.user else None
    def get_solution_group_name(self, obj):
        return obj.solution_group.group_name if obj.solution_group else None
    
class AssigneeTicketSerializer(serializers.ModelSerializer):
    solution_group_name = serializers.SerializerMethodField()
    class Meta:
        model = SolutionGroupTickets
        fields = ['solution_group_name']
        extra_kwargs = {
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }

    def get_solution_group_name(self, obj):
        return obj.solution_group.group_name if obj.solution_group else None
    
    
    
    
class TicketgroupSerializer(serializers.ModelSerializer):
    
    username = serializers.SerializerMethodField()
    solution_group_name = serializers.SerializerMethodField()
    ticket_details = TicketSerializer(source='ticket_id', many=False)  # Use 'ticket_id' directly as it's the ForeignKey

    
    class Meta:
        model = SolutionGroupTickets
        fields = ['solution_group_name','username','ticket_id','ticket_details']
        extra_kwargs = {
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }
    def get_username(self, obj):
        return obj.user.username if obj.user else None
    def get_solution_group_name(self, obj):
        return obj.solution_group.group_name if obj.solution_group else None