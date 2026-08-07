from rest_framework import serializers
from .models import Priority
from organisation_details.models import Organisation  # Assuming this is the correct import path
class PrioritySerializer(serializers.ModelSerializer):
    response_target_time = serializers.SerializerMethodField()
    input_response_target_time = serializers.DurationField(write_only=True, source='response_target_time')
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    # organisation = serializers.SlugRelatedField(read_only=True, slug_field='organisation_name')
    organisation = serializers.SlugRelatedField(
        slug_field='organisation_name',
        queryset=Organisation.objects.all(),  # Replace with actual model
        required=True
    )
 
    class Meta:
        model = Priority
        fields = '__all__'
        extra_kwargs = {
            'response_target_time': {'required': True}, # Must be provided
            # 'organisation': {'required': True},  # Must be provided
        }
    def get_response_target_time(self, obj):
        duration = obj.response_target_time
        days = duration.days
        hours, remainder = divmod(duration.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{days}days {hours:02}:{minutes:02}:{seconds:02}"
 