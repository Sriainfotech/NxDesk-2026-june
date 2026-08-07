from django.db import models
from category.models import Category
from login_details.models import User


class KnowledgeArticle(models.Model):
    article_id = models.AutoField(primary_key=True)  # Primary Key
    title = models.CharField(max_length=255)  # Article Title
    solution = models.TextField()  # Article Content
    cause_of_the_issue = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)

    # Optional many-to-many relation to tickets
    related_tickets = models.ManyToManyField(
        "timer.Ticket",
        blank=True,
        related_name='knowledge_articles'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles_created'
    )
    modified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='articles_updated'
    )

    def __str__(self):
        return self.title
