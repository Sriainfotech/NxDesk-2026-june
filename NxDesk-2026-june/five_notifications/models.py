from django.db import models
# from django.contrib.auth import get_user_model
from django.conf import settings
from django.contrib.auth.models import User
from login_details.models import User
# from Knowledge_article.models import KnowledgeArticle
 
 
class Appreciation(models.Model):
    user = models.ForeignKey('login_details.User', on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey( 'login_details.User',on_delete=models.CASCADE, related_name='Appreciation_created')
    modified_by = models.ForeignKey( 'login_details.User',on_delete=models.CASCADE, related_name='Appreciation_updated')
 
    def __str__(self):
        return f"{self.user.username} - {self.message}"
 
 
# User = get_user_model
class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey( 'login_details.User', on_delete=models.CASCADE, related_name='Announcement_created')
    modified_by = models.ForeignKey( 'login_details.User', on_delete=models.CASCADE, related_name='Announcement_updated')
   
    def __str__(self):
        return self.title
 
 

 

class Notification(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('login_details.User', on_delete=models.CASCADE, related_name='Notification_created')
    modified_by = models.ForeignKey('login_details.User', on_delete=models.CASCADE, related_name='Notification_updated')





class OpenItem(Notification):
    user = models.ForeignKey('login_details.User', on_delete=models.CASCADE)
    status = models.CharField(
        max_length=50, 
        choices=[
            ('open', 'Open'), 
            ('in_progress', 'In Progress'), 
            ('closed', 'Closed')
        ]
    )




class RecentItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # User who viewed the item
    title = models.CharField(max_length=255)  # Item type (e.g., Knowledge Article, Ticket)
    content = models.TextField()  # Content like item ID or additional details
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} viewed by {self.user.username} at {self.created_at}"
    
from timer.models import Ticket
class TicketInteraction(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)
    user = models.ForeignKey('login_details.User', on_delete=models.CASCADE)
    interaction_type = models.CharField(max_length=50, choices=[
        ('view', 'View'),
        ('comment', 'Comment'),
        ('update', 'Update'),
    ])
    timestamp = models.DateTimeField(auto_now_add=True)
