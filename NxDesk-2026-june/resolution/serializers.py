from rest_framework import serializers
from .models import Resolution
import re

class ResolutionSerializer(serializers.ModelSerializer):
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    
    class Meta:
        model = Resolution
        fields = '__all__'

        extra_kwargs = {
            'ticket_id': {'required': True},
            'created_by': {'read_only': True},  
            'modified_by': {'read_only': True},
        }

    def validate_efforts_consumed(self, value):
        """Custom validation for efforts_consumed field"""
        if value:
            # Check if format is HH:MM
            pattern = r'^([0-9]{1,2}):([0-5][0-9])$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "Efforts consumed must be in HH:MM format (e.g., 02:30)"
                )
            
            # Additional validation: ensure hours are reasonable (0-99)
            hours, minutes = map(int, value.split(':'))
            if hours > 99:
                raise serializers.ValidationError(
                    "Hours cannot exceed 99"
                )
        
        return value