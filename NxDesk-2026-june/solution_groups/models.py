from django.db import models
from login_details.models import User

# from timer.models import Ticket
# from simple_history.models import HistoricalRecords
def __str__(self):
    return f'Solution {self.solution_id} for Ticket {self.ticket_id}'
class SolutionGroup(models.Model):
    solution_id=models.AutoField(primary_key=True)
    organisation = models.ForeignKey(
        'organisation_details.Organisation',
        on_delete=models.SET_NULL,
        null=True,
        related_name='solution_groups'  
    )
    category = models.ForeignKey('category.Category',on_delete=models.SET_NULL,null=True,related_name='solution_groups')
    group_name = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    modified_by = models.ForeignKey(User, on_delete=models.SET_NULL,null=True, blank=True, related_name='group_modified')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='group_created')
    
    #history = HistoricalRecords()
    
class SolutionGroupTickets(models.Model):
    user = models.ForeignKey("login_details.User", on_delete=models.CASCADE, related_name='solution_group_engineer')
    solution_group = models.ForeignKey(SolutionGroup, on_delete=models.CASCADE, related_name='solution_group_tickets')
    ticket_id = models.ForeignKey("timer.Ticket",on_delete=models.SET_NULL,null=True,related_name='solution_groups_tickets')
   
  
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='project_grouop_id_created_by'
    )
    modified_by = models.ForeignKey(
        'login_details.User', on_delete=models.SET_NULL, null=True, related_name='project_group_id_modified_by'
    )