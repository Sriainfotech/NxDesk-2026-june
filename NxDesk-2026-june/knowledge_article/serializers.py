


from rest_framework import serializers
from .models import KnowledgeArticle
from timer.models import Ticket


class KnowledgeArticleSerializer(serializers.ModelSerializer):
#     related_tickets = serializers.PrimaryKeyRelatedField(
#     many=True, queryset=Ticket.objects.all(), required=True
# )

    created_by = serializers.ReadOnlyField(source='created_by.username')
    modified_by = serializers.ReadOnlyField(source='modified_by.username')  # Corrected

    class Meta:
        model = KnowledgeArticle
        fields = [
            'article_id', 'title', 'solution', 'cause_of_the_issue', 'category',
            'related_tickets', 'created_at', 'modified_at', 'created_by', 'modified_by',
        ]
