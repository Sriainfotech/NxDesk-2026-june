# serializers.py
from rest_framework import serializers
from .models import IssueCategory, IssueType

class IssueTypeSerializer(serializers.ModelSerializer):
    # icon_url = serializers.SerializerMethodField()
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    icon_url = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = IssueType
        # fields = ['issue_type_id', 'name', 'description', 'icon_url','is_active']
        fields = '__all__'

    def get_icon_url(self, obj):
        request = self.context.get('request')
        if obj.icon:
            return request.build_absolute_uri(obj.icon.url)
        return None

 
class IssueCategorySerializer(serializers.ModelSerializer):
    issue_types = IssueTypeSerializer(many=True, read_only=True)
    icon_url = serializers.ImageField(required=False)
    name = serializers.CharField(required=True)
    # icon_url = serializers.SerializerMet hodField()
    created_by = serializers.SlugRelatedField(read_only=True, slug_field='username')
    modified_by = serializers.SlugRelatedField(read_only=True, slug_field='username')

    class Meta:
        model = IssueCategory
        # fields = ['issue_category_id', 'name', 'description', 'icon_url', 'issue_types','is_active']
        fields = '__all__'


    def validate(self, data):
    # If 'icon_url' is required but not passed, handle it
        if 'icon_url' in data and not data['icon_url']:
            data['icon_url'] = None  # Or handle it in any other way you want
        return data

    def get_icon_url(self, obj):
        request = self.context.get('request')
        if request and obj.icon:
            return request.build_absolute_uri(obj.icon.url)
        return None

