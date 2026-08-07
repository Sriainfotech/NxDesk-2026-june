"""
Check current working hours and why S00000001 isn't being auto-scheduled
"""
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ticketing_tool.settings')
import django
django.setup()

from timer.models import Ticket, WorkingHours
from django.utils import timezone
import pytz

ticket = Ticket.objects.get(ticket_id='S00000001')
sla = ticket.sla_timers

# Get working hours
wh = sla.working_hours
if not wh:
    ticket_org = getattr(ticket, 'ticket_organization', None)
    if ticket_org:
        wh = getattr(ticket_org, 'working_hours', None)
if not wh:
    assignee = getattr(ticket, 'assignee', None)
    if assignee:
        assignee_org = getattr(assignee, 'organisation', None)
        if assignee_org:
            wh = getattr(assignee_org, 'working_hours', None)

print(f"Ticket: {ticket.ticket_id}")
print(f"Status: {ticket.status}")
print(f"SLA Status: {sla.sla_status}")
print(f"\nWorking Hours:")
if wh:
    print(f"  ID: {wh.id}")
    print(f"  Name: {wh.name}")
    print(f"  Start: {wh.start_hour}")
    print(f"  End: {wh.end_hour}")
else:
    print("  No working hours configured")

ist = pytz.timezone('Asia/Kolkata')
now = timezone.now().astimezone(ist)
print(f"\nCurrent time (IST): {now.time()}")

if wh:
    within = wh.start_hour <= now.time() <= wh.end_hour
    print(f"Within working hours? {within}")
    if not within:
        print(f"  → After hours (current: {now.time()}, end: {wh.end_hour})")
        print(f"  → This Active ticket SHOULD be auto-scheduled")
