
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from resolution.models import Resolution
# from .models import KnowledgeArticle

# @receiver(post_save, sender=Resolution)
# def create_or_update_knowledge_article(sender, instance, created, **kwargs):
#     """
#     Triggered whenever a Resolution is saved.
#     Automatically creates or updates a KnowledgeArticle for the related ticket.
#     """
#     ticket = instance.ticket_id  # this is the Ticket object
#     if not ticket:
#         return  # No ticket associated

#     # Get all resolutions for this ticket
#     resolutions = Resolution.objects.filter(ticket_id=ticket).order_by('modified_at')
#     solution_text = "\n\n".join(
#         [f"{r.resolution_type}: {r.resolution_description}" for r in resolutions if r.resolution_description]
#     )

#     # Safely get category
#     category = None
#     if hasattr(ticket, 'service_domain') and ticket.service_domain and hasattr(ticket.service_domain, 'category'):
#         category = ticket.service_domain.category

#     # Safely get user
#     user = instance.modified_by or instance.created_by

#     # Get or create KnowledgeArticle
#     article, created_article = KnowledgeArticle.objects.get_or_create(
#         title=f"Resolution for Ticket {ticket.ticket_id}",
#         defaults={
#             "solution": solution_text,
#             "cause_of_the_issue": ticket.description ,
#             # "category": category,
#             "created_by": user,
#             "modified_by": user
#         }
#     )

#     # Update existing article if already exists
#     if not created_article:
#         article.solution = solution_text
#         article.modified_by = user
#         article.save()

#     # Add ticket to M2M
#     article.related_tickets.add(ticket)


from django.db.models.signals import post_save
from django.dispatch import receiver
from resolution.models import Resolution
from knowledge_article.models import KnowledgeArticle

@receiver(post_save, sender=Resolution)
def update_knowledge_article_from_resolution(sender, instance, created, **kwargs):
    ticket = instance.ticket_id
    if not ticket:
        return

    # Automatically mark ticket as resolved
    ticket.status = "Resolved"
    ticket.modified_by = instance.modified_by or instance.created_by
    ticket.save()

    # Gather all resolutions for this ticket
    resolutions = Resolution.objects.filter(ticket_id=ticket).order_by('created_at')
    solution_text = "\n\n".join([r.resolution_description for r in resolutions if r.resolution_description])

    # Create or update Knowledge Article
    article = KnowledgeArticle.objects.filter(related_tickets=ticket).first()
    if article:
        article.solution = solution_text
        article.modified_by = ticket.modified_by
        article.save()
    else:
        article = KnowledgeArticle.objects.create(
            title=f"Resolution for Ticket {ticket.ticket_id}: {ticket.summary}",
            solution=solution_text,
            cause_of_the_issue=ticket.description or "",
            category=ticket.service_domain.category if ticket.service_domain else None,
            created_by=ticket.modified_by,
            modified_by=ticket.modified_by
        )
        article.related_tickets.add(ticket)
