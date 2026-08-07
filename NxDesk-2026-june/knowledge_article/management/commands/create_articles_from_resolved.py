
from django.core.management.base import BaseCommand
from timer.models import Ticket
from knowledge_article.models import KnowledgeArticle

class Command(BaseCommand):
    help = "Create KnowledgeArticles automatically from resolved tickets"

    def handle(self, *args, **kwargs):
        resolved_tickets = Ticket.objects.filter(status="Resolved")
        created_count = 0

        for ticket in resolved_tickets:
            # Skip if article already exists for this ticket
            if KnowledgeArticle.objects.filter(related_tickets=ticket).exists():
                continue

            # Create KnowledgeArticle
            article = KnowledgeArticle.objects.create(
                title=f"Resolution for Ticket {ticket.ticket_id}: {ticket.summary}",
                solution=ticket.description,
                cause_of_the_issue="Check ticket description",
                created_by=ticket.created_by,
                modified_by=ticket.modified_by
            )
            # Link the ticket
            article.related_tickets.add(ticket)
            article.save()
            created_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"KnowledgeArticles created from resolved tickets: {created_count}"
        ))
