from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RecentItem,UserAction
from datetime import datetime
from .models import RecentItem
from knowledge_article.models import KnowledgeArticle
from timer.models import Ticket

@receiver(post_save, sender=UserAction)
def log_recent_item(sender, instance, **kwargs):
    # Create or update a RecentItem entry
    RecentItem.objects.create(
        user=instance.user,
        entity_type=instance.entity_type,
        url=instance.url,
        article_id=instance.article_id
    )


def record_recent_item(user, article_id):
    # Get the knowledge article by ID
    try:
        article = KnowledgeArticle.objects.get(id=article_id)
        recent_item = RecentItem(
            user=user,
            title=f"Knowledge Article ID: {article.id}", 
            content=f"Title: {article.title}",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        recent_item.save()
    except KnowledgeArticle.DoesNotExist:
        print(f"Article with ID {article_id} does not exist.")


from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TicketInteraction

@receiver(post_save, sender=TicketInteraction)
def increment_view_count(sender, instance, **kwargs):
    if instance.interaction_type == 'view':
        ticket = instance.ticket
        ticket.view_count += 1
        ticket.save()
 