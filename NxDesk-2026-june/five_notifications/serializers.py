
from rest_framework import serializers
from .models import Appreciation,Announcement,RecentItem
# from .models import RecentItem
# from timer.models import Ticket
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'created_at', 'modified_at', 'created_by', 'modified_by']
        created_by = serializers.ReadOnlyField(source='created_by.username')
        modified_by = serializers.ReadOnlyField(source='updated_by.username')


class AppreciationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appreciation
        fields = ['id', 'user', 'message', 'created_at', 'modified_at', 'created_by', 'modified_by']
        created_by = serializers.ReadOnlyField(source='created_by.username')
        modified_by = serializers.ReadOnlyField(source='updated_by.username')


class RecentItemSerializer(serializers.ModelSerializer):
    # NOTE: RecentItem has no "knowledge_article" model field at all - this
    # will raise AttributeError the moment DRF actually tries to serialize
    # an instance. Pre-existing bug, kept as-is here (not introduced by
    # the __all__ -> explicit fields change below) - needs a real fix
    # once it's clear what this was meant to reference.
    knowledge_article = serializers.StringRelatedField()  # If you want to display the article's title

    class Meta:
        model = RecentItem
        fields = ['id', 'user', 'title', 'content', 'created_at', 'modified_at', 'knowledge_article']