from django.db.models.signals import post_save, post_delete
from django.db import models
from django.dispatch import receiver
from django.utils import timezone
import pytz

from .models import Holiday, SLATimer


@receiver(post_save, sender=Holiday)
def handle_holiday_saved(sender, instance, created, **kwargs):
    """
    When a Holiday is created for a date, make sure any active SLAs
    that fall on that date are paused (and auto-scheduled) and any
    SLAs scheduled to start on that date are moved to the next working day.
    """
    # Always react when a Holiday row is created/updated for any date.
    # Find SLATimers whose effective working hours match the Holiday's working_hours.
    # This includes SLATimers that have working_hours set directly or inherit via ticket organisation or assignee organisation.
    try:
        wh = instance.working_hours

        # Build queryset matching direct or inherited working_hours
        qs_active = SLATimer.objects.filter(sla_status='Active').filter(
            models.Q(working_hours=wh) |
            models.Q(ticket__ticket_organization__working_hours=wh) |
            models.Q(ticket__assignee__organisation__working_hours=wh)
        )

        for t in qs_active:
            try:
                t.pause_sla(auto_schedule=True)
            except Exception:
                continue

        # Scheduled timers that were due to start on the holiday date should be moved forward
        qs_scheduled = SLATimer.objects.filter(sla_status='Scheduled').filter(
            models.Q(working_hours=wh) |
            models.Q(ticket__ticket_organization__working_hours=wh) |
            models.Q(ticket__assignee__organisation__working_hours=wh)
        )

        # For scheduled timers, if their start_time's date equals the holiday date, push to next working day
        for s in qs_scheduled:
            try:
                if s.start_time and s.start_time.date() == instance.date:
                    # Determine working hours to use for get_next_start_time
                    effective_wh = s.working_hours or getattr(s.ticket.ticket_organization, 'working_hours', None) or getattr(getattr(s.ticket.assignee, 'organisation', None), 'working_hours', None) or wh
                    s.start_time = s.get_next_start_time(effective_wh)
                    # Recalculate due date to reflect moved start
                    response_time = getattr(s.ticket.priority, 'response_target_time', None)
                    if response_time is None:
                        from datetime import timedelta
                        response_time = timedelta(hours=8)
                    s.sla_due_date = s.calculate_sla_due_with_working_hours(response_time)
                    s.save(update_fields=['start_time', 'sla_due_date'])
            except Exception:
                continue
    except Exception:
        # Swallow errors in signal handler to avoid breaking admin actions
        return


@receiver(post_delete, sender=Holiday)
def handle_holiday_deleted(sender, instance, **kwargs):
    """
    If a holiday is removed for today, try to activate scheduled SLAs that
    may be eligible to start now. This is best-effort — the periodic scheduler
    will also activate scheduled SLAs when appropriate.
    """
    try:
        ist = pytz.timezone('Asia/Kolkata')
        today = timezone.now().astimezone(ist).date()
    except Exception:
        today = timezone.now().date()

    if instance.date != today:
        return

    # Try to activate scheduled SLAs whose start_time is today (or <= now)
    try:
        sched = SLATimer.objects.filter(working_hours=instance.working_hours, sla_status='Scheduled')
        for s in sched:
            try:
                s.activate_scheduled_sla()
            except Exception:
                continue
    except Exception:
        return




# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

Ticket = apps.get_model("timer", "Ticket")
SLATimer = apps.get_model("timer", "SLATimer")


# @receiver(post_save, sender=Ticket)
def ticket_status_update(sender, instance, created, **kwargs):
    if created:
        return

    try:
        sla_timer = SLATimer.objects.get(ticket=instance)
    except SLATimer.DoesNotExist:
        return

    # Pause only if status changed to 'Waiting for User Response' and not already paused
    if instance.status == "Waiting for User Response" and sla_timer.sla_status != "Paused":
        sla_timer.pause_sla()

    # Resume only if status changed to 'Working in Progress' and currently paused
    elif instance.status == "Working in Progress" and sla_timer.sla_status == "Paused":
        sla_timer.resume_sla()

    # Calculate remaining time safely
    remaining = sla_timer.calculate_remaining_time()

    # WebSocket payload
    payload = {
        "type": "timer_message",
        "action": "status_update",
        "ticket_id": instance.ticket_id,
        "status": instance.status,
        "sla_status": sla_timer.sla_status,
        "remaining_time": str(remaining).split('.')[0] if remaining else None,
        "due_date": str(sla_timer.sla_due_date) if sla_timer.sla_due_date else None,
    }

    # Send via WebSocket
    channel_layer = get_channel_layer()
    group_name = f"timer_{instance.ticket_id}"
    async_to_sync(channel_layer.group_send)(group_name, payload)


# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import pytz

Ticket = apps.get_model("timer", "Ticket")
SLATimer = apps.get_model("timer", "SLATimer")
from timer.models import WorkingHours


@receiver(post_save, sender=Ticket)
def check_ticket_working_hours(sender, instance, created, **kwargs):
    if created:
        try:
            wh = WorkingHours.objects.first()  # or filter by organisation if needed
            if not wh:
                return

            # Convert ticket creation time to IST
            ist = pytz.timezone('Asia/Kolkata')
            created_time_ist = instance.created_at.astimezone(ist)

            # Compare
            if wh.start_hour <= created_time_ist.time() <= wh.end_hour:
                instance.is_within_working_hours = True
            else:
                instance.is_within_working_hours = False

            instance.save(update_fields=["is_within_working_hours"])

        except Exception as e:
            print("⚠️ Error checking working hours:", e)



