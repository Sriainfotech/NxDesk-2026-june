from django.test import TestCase

from django.test import TestCase
from django.contrib.auth import get_user_model
from timer.models import Ticket
from resolution.models import Resolution
from knowledge_article.models import KnowledgeArticle

class KnowledgeArticleTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create(username="testuser")
        self.ticket = Ticket.objects.create(
            ticket_id="TICKET001",
            summary="Test Summary",
            description="Test Description",
            status="Open",
            modified_by=self.user,
            created_by=self.user
        )
        self.resolution = Resolution.objects.create(
            ticket_id=self.ticket,
            resolution_type="fixed",
            resolution_description="Resolved via test.",
            created_by=self.user,
            modified_by=self.user,
            incident_based_on="none",
            incident_category="none"
        )

    def test_article_created_on_resolve(self):
        self.ticket.status = "Resolved"
        self.ticket.modified_by = self.user
        self.ticket.save()

        article = KnowledgeArticle.objects.filter(related_tickets=self.ticket).first()
        self.assertIsNotNone(article)
        self.assertEqual(article.title, f"Resolution: {self.ticket.summary}")
