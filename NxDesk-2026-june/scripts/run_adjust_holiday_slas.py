import os
import sys
from datetime import timedelta

# Ensure DJANGO_SETTINGS_MODULE matches your project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ticketing_tool.settings')

import django
# Ensure project root is on sys.path so Django package can be imported
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

django.setup()

from django.db.models import Q
from django.utils import timezone
import pytz

from timer.models import Holiday, SLATimer

ist = pytz.timezone('Asia/Kolkata')
# Use today's date in IST; change this to the holiday date if different
today = timezone.now().astimezone(ist).date()

h = Holiday.objects.filter(date=today).first()
if not h:
    print('No Holiday found for', today)
    sys.exit(0)

print('Found Holiday:', h)
wh = h.working_hours

# Pause active timers (auto-schedule to next working day) - iterate to avoid complex joins
for t in SLATimer.objects.filter(sla_status='Active'):
    try:
        effective_wh = t.working_hours or getattr(t.ticket.ticket_organization, 'working_hours', None) or getattr(getattr(t.ticket.assignee, 'organisation', None), 'working_hours', None)
        if effective_wh and effective_wh.id == wh.id:
            t.pause_sla(auto_schedule=True)
            print('Paused and scheduled:', t.sla_id, t.ticket.ticket_id)
    except Exception as e:
        print('Error pausing', getattr(t, 'sla_id', None), e)

# Move scheduled timers starting on the holiday to next working day
for s in SLATimer.objects.filter(sla_status='Scheduled'):
    try:
        effective_wh = s.working_hours or getattr(s.ticket.ticket_organization, 'working_hours', None) or getattr(getattr(s.ticket.assignee, 'organisation', None), 'working_hours', None)
        if effective_wh and effective_wh.id == wh.id and s.start_time and s.start_time.date() == h.date:
            s.start_time = s.get_next_start_time(effective_wh)
            response_time = getattr(s.ticket.priority, 'response_target_time', None) or timedelta(hours=8)
            s.sla_due_date = s.calculate_sla_due_with_working_hours(response_time)
            s.save(update_fields=['start_time', 'sla_due_date'])
            print('Rescheduled:', s.sla_id, s.ticket.ticket_id, '->', s.start_time)
    except Exception as e:
        print('Error rescheduling', getattr(s, 'sla_id', None), e)

print('Done adjusting SLATimers for holiday', h)
