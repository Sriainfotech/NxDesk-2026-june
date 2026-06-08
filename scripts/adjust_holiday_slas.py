from django.db.models import Q
from django.utils import timezone
import pytz
from datetime import timedelta

from timer.models import Holiday, SLATimer

ist = pytz.timezone('Asia/Kolkata')
# Use today's date in IST; change this to the holiday date if different
today = timezone.now().astimezone(ist).date()

h = Holiday.objects.filter(date=today).first()
if not h:
    print('No Holiday found for', today)
else:
    print('Found Holiday:', h)
    wh = h.working_hours

    # Pause active timers (auto-schedule to next working day)
    qs_active = SLATimer.objects.filter(sla_status='Active').filter(
        Q(working_hours=wh) |
        Q(ticket__ticket_organization__working_hours=wh) |
        Q(ticket__assignee__organisation__working_hours=wh)
    )
    for t in qs_active:
        try:
            t.pause_sla(auto_schedule=True)
            print('Paused and scheduled:', t.sla_id, t.ticket.ticket_id)
        except Exception as e:
            print('Error pausing', t.sla_id, e)

    # Move scheduled timers starting on the holiday to next working day
    qs_scheduled = SLATimer.objects.filter(sla_status='Scheduled').filter(
        Q(working_hours=wh) |
        Q(ticket__ticket_organization__working_hours=wh) |
        Q(ticket__assignee__organisation__working_hours=wh)
    )
    for s in qs_scheduled:
        try:
            if s.start_time and s.start_time.date() == h.date:
                effective_wh = s.working_hours or getattr(s.ticket.ticket_organization, 'working_hours', None) or getattr(getattr(s.ticket.assignee, 'organisation', None), 'working_hours', None) or wh
                s.start_time = s.get_next_start_time(effective_wh)
                response_time = getattr(s.ticket.priority, 'response_target_time', None) or timedelta(hours=8)
                s.sla_due_date = s.calculate_sla_due_with_working_hours(response_time)
                s.save(update_fields=['start_time', 'sla_due_date'])
                print('Rescheduled:', s.sla_id, s.ticket.ticket_id, '->', s.start_time)
        except Exception as e:
            print('Error rescheduling', s.sla_id, e)

    print('Done adjusting SLATimers for holiday', h)
