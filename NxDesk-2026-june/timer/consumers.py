

import logging
from datetime import datetime, time, timedelta
from django.utils import timezone
import pytz
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)

@sync_to_async
def get_working_hours_from_db(ticket_id):
    """Fetch working hours from database for the given ticket."""
    try:
        from django.apps import apps
        Ticket = apps.get_model('timer', 'Ticket')
        SLATimer = apps.get_model('timer', 'SLATimer')
        
        ticket = Ticket.objects.select_related('sla_timers__working_hours').get(ticket_id=ticket_id)
        sla_timer = ticket.sla_timers
        
        # Get working hours from SLA timer (same logic as models.py start_sla)
        working_hours = sla_timer.working_hours if sla_timer else None
        
        if not working_hours:
            ticket_org = getattr(ticket, 'ticket_organization', None)
            if ticket_org:
                working_hours = getattr(ticket_org, 'working_hours', None)
        
        if not working_hours:
            assignee = getattr(ticket, 'assignee', None)
            if assignee:
                assignee_org = getattr(assignee, 'organisation', None)
                if assignee_org:
                    working_hours = getattr(assignee_org, 'working_hours', None)
        
        if working_hours:
            return {
                'start_time': working_hours.start_hour,
                'end_time': working_hours.end_hour,
                'timezone': 'Asia/Kolkata'
            }
    except Exception:
        logger.exception(f"Error fetching working hours for ticket {ticket_id}")

    # Default fallback - should match the database now
    return {
        'start_time': time(9, 30),
        'end_time': time(18, 30),
        'timezone': 'Asia/Kolkata'
    }

async def is_within_working_hours(ticket_id):
    """Return True if now is within working hours."""
    wh = await get_working_hours_from_db(ticket_id)
    tz = pytz.timezone(wh['timezone'])
    now = timezone.now().astimezone(tz)
    return wh['start_time'] <= now.time() <= wh['end_time']

async def get_next_start_time(ticket_id):
    """Get the next start time based on working hours from database."""
    wh = await get_working_hours_from_db(ticket_id)
    tz = pytz.timezone(wh['timezone'])
    now = timezone.now().astimezone(tz)
    start_work = wh['start_time']
    end_work = wh['end_time']

    logger.debug(f"[Ticket {ticket_id}] Current time: {now.time()}, Working hours: {start_work} - {end_work}")

    if now.time() < start_work:
        # Before working hours — start today at start_time
        next_start = datetime.combine(now.date(), start_work)
    elif now.time() > end_work:
        # After working hours — start tomorrow at start_time
        next_start = datetime.combine(now.date() + timedelta(days=1), start_work)
    else:
        # Within working hours - start immediately
        next_start = now

    return tz.localize(next_start) if next_start.tzinfo is None else next_start

import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.apps import apps
from django.utils import timezone

# ✅ Store running timers globally (one per ticket)
active_timers = {}


class TimerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.ticket_id = self.scope['url_route']['kwargs']['ticket_id']
            self.group_name = f"timer_{self.ticket_id}"

            # ✅ Add to channel group
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()

            # ✅ Send initial snapshot
            await self.send_initial_timer()

            # ✅ Start the SLA scheduler only if not already running for this ticket
            if self.ticket_id not in active_timers:
                # Try to activate scheduled SLA immediately if current hours allow
                try:
                    ticket = await self.get_ticket()
                    sla_timer = await self.get_sla_timer(ticket)
                    if sla_timer:
                        activated = await sync_to_async(sla_timer.maybe_activate_now)()
                        if activated:
                            logger.info(f"[TIMER START] SLA activated now for {self.ticket_id}; starting scheduler.")
                            active_timers[self.ticket_id] = asyncio.create_task(self.sla_schedule_loop())
                            return
                except Exception:
                    logger.exception(f"maybe_activate_now failed for ticket {self.ticket_id}")

                next_start_time = await get_next_start_time(self.ticket_id)
                now = timezone.now()

                if now < next_start_time:
                    delay = (next_start_time - now).total_seconds()
                    logger.info(f"[TIMER WAIT] Waiting {delay/3600:.2f} hours to start timer for Ticket {self.ticket_id} at {next_start_time}")
                    # Schedule it for later
                    active_timers[self.ticket_id] = asyncio.create_task(self.delayed_timer_start(delay))
                else:
                    logger.info(f"[TIMER START] Starting scheduler immediately for Ticket {self.ticket_id}")
                    active_timers[self.ticket_id] = asyncio.create_task(self.sla_schedule_loop())

            else:
                logger.info(f"[TIMER EXISTS] Scheduler already running for Ticket {self.ticket_id}. Joining existing group.")

        except Exception:
            logger.exception(f"WebSocket connect error for ticket {getattr(self, 'ticket_id', '?')}")
            await self.close()

    async def disconnect(self, close_code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

            # ✅ If no users left in the group, stop the scheduler
            group_size = len(self.channel_layer.groups.get(self.group_name, set()))
            if group_size == 0 and self.ticket_id in active_timers:
                logger.info(f"[TIMER STOP] No clients left, stopping scheduler for {self.ticket_id}")
                active_timers[self.ticket_id].cancel()
                del active_timers[self.ticket_id]

        except Exception:
            logger.exception(f"WebSocket disconnect error for ticket {getattr(self, 'ticket_id', '?')}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("action") == "update_status":
                await self.update_status(data)
        except Exception:
            logger.exception(f"WebSocket receive error for ticket {getattr(self, 'ticket_id', '?')}")

    # ------------------------------
    # Database Accessors
    # ------------------------------
    @sync_to_async
    def get_ticket(self):
        Ticket = apps.get_model('timer', 'Ticket')
        return Ticket.objects.get(ticket_id=self.ticket_id)

    @sync_to_async
    def get_sla_timer(self, ticket):
        SLATimer = apps.get_model('timer', 'SLATimer')
        try:
            return ticket.sla_timers  # Adjust if your related_name differs
        except SLATimer.DoesNotExist:
            return None

    # ------------------------------
    # Initial Timer Data
    # ------------------------------
    async def send_initial_timer(self):
        try:
            ticket = await self.get_ticket()
            sla_timer = await self.get_sla_timer(ticket)

            # Calculate remaining time using sync_to_async to avoid ORM in async context
            remaining_time = await sync_to_async(sla_timer.calculate_remaining_time)()

            await self.send(text_data=json.dumps({
                "action": "timer_init",
                "ticket_id": ticket.ticket_id,
                "status": ticket.status,
                "sla_status": sla_timer.sla_status,
                "remaining_time": str(remaining_time),
                "due_date": str(sla_timer.sla_due_date),
                "start_time": str(sla_timer.start_time),  # ✅ Added for scheduled tickets
            }))
        except Exception:
            logger.exception(f"send_initial_timer error for ticket {getattr(self, 'ticket_id', '?')}")

    async def broadcast_timer_state(self, action, ticket, sla_timer):
        """Push one state-change event (not a per-second tick) to every
        client viewing this ticket. The frontend runs its own local
        second-by-second countdown and only needs to resync on events
        like this — see sla_schedule_loop() below."""
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "timer_message",
                "action": action,
                "ticket_id": ticket.ticket_id,
                "status": ticket.status,
                "sla_status": sla_timer.sla_status,
                "remaining_time": str(await sync_to_async(sla_timer.calculate_remaining_time)()),
                "due_date": str(sla_timer.sla_due_date),
                "start_time": str(sla_timer.start_time),
            }
        )

    # ------------------------------
    # SLA Scheduler (event-driven, 1 per ticket)
    # ------------------------------
    # Replaces the old 1-second polling loop. The database (sla_due_date,
    # start_time, sla_status, total_paused_time, etc.) remains the single
    # source of truth — this coroutine does no work at all except at the
    # exact moments the SLA's own business rules (working hours) say its
    # state could change, then it calls the *same* pause_sla()/resume_sla()
    # methods as before and broadcasts a single state-change event.
    # The frontend is responsible for the visual second-by-second countdown.
    MAX_SLEEP_SECONDS = 6 * 3600  # safety valve: re-validate at least this often

    async def sla_schedule_loop(self):
        try:
            while True:
                ticket = await self.get_ticket()
                sla_timer = await self.get_sla_timer(ticket)
                if not sla_timer:
                    return

                # Terminal states: nothing left for the scheduler to do.
                if sla_timer.sla_status in ('Stopped', 'Breached') or \
                        str(ticket.status).lower() in ('resolved', 'closed', 'canceled'):
                    logger.info(f"[TIMER STOP] Ticket {self.ticket_id} reached terminal state; scheduler exiting.")
                    return

                wh = await get_working_hours_from_db(self.ticket_id)
                tz = pytz.timezone(wh['timezone'])
                now = timezone.now()
                now_local = now.astimezone(tz)
                within_hours = wh['start_time'] <= now_local.time() <= wh['end_time']

                if sla_timer.sla_status == 'Active':
                    if not within_hours:
                        # Working-hours boundary already passed — auto-pause now.
                        await sync_to_async(sla_timer.pause_sla)(auto_schedule=True)
                        await self.broadcast_timer_state("timer_auto_scheduled", ticket, sla_timer)
                        continue

                    end_today_local = now_local.replace(
                        hour=wh['end_time'].hour, minute=wh['end_time'].minute,
                        second=0, microsecond=0,
                    )
                    delay = (end_today_local - now_local).total_seconds()
                    if delay <= 0:
                        continue
                    await asyncio.sleep(min(delay, self.MAX_SLEEP_SECONDS))
                    continue

                elif sla_timer.sla_status in ('Paused', 'Scheduled'):
                    # Only auto-resume if ticket isn't in a user-waiting state
                    if within_hours and str(ticket.status).lower() not in ["waiting for user response"]:
                        await sync_to_async(sla_timer.resume_sla)()
                        await self.broadcast_timer_state("timer_auto_resumed", ticket, sla_timer)
                        continue

                    if within_hours:
                        # Blocked purely by ticket status (e.g. "Waiting for
                        # User Response") — nothing time-based to wait on, so
                        # poll at a coarse interval just to notice a status
                        # change. Manual changes already broadcast instantly
                        # via update_status(); this is only a safety net.
                        await asyncio.sleep(60)
                        continue

                    next_start = await get_next_start_time(self.ticket_id)
                    delay = (next_start - now).total_seconds()
                    if delay <= 0:
                        continue
                    await asyncio.sleep(min(delay, self.MAX_SLEEP_SECONDS))
                    continue

                else:
                    return
        except asyncio.CancelledError:
            logger.info(f"[TIMER STOP] SLA scheduler cancelled for ticket {self.ticket_id}")
        except Exception:
            logger.exception(f"sla_schedule_loop error for ticket {self.ticket_id}")

    # ------------------------------
    # Ticket Status Updates
    # ------------------------------
    async def update_status(self, data):
        new_status = data.get("status")
        if not new_status:
            return

        try:
            ticket = await self.get_ticket()
            sla_timer = await self.get_sla_timer(ticket)

            ticket.status = new_status
            await sync_to_async(ticket.save)()

            action_type = "status_update"
            if sla_timer:
                if new_status.lower() == "waiting for user response":
                    await sync_to_async(sla_timer.pause_sla)()
                    action_type = "timer_paused"
                elif new_status.lower() in ["working in progress", "in progress"]:
                    # Block starting if SLA is scheduled for future
                    should_block = False
                    if sla_timer.sla_status == "Scheduled" and sla_timer.start_time:
                        from django.utils import timezone as dj_tz
                        if dj_tz.now() < sla_timer.start_time:
                            should_block = True
                    if should_block:
                        action_type = "timer_blocked"
                    else:
                        await sync_to_async(sla_timer.resume_sla)()
                        action_type = "timer_resumed"
                elif new_status.lower() in ["resolved", "closed"]:
                    await sync_to_async(sla_timer.stop_sla)()
                    action_type = "timer_stopped"

            await self.channel_layer.group_send(
                self.group_name,
                {
                    "type": "timer_message",
                    "action": action_type,
                    "ticket_id": ticket.ticket_id,
                    "status": ticket.status,
                    "sla_status": sla_timer.sla_status if sla_timer else None,
                    "remaining_time": str(await sync_to_async(sla_timer.calculate_remaining_time)()) if sla_timer else None,
                    "due_date": str(sla_timer.sla_due_date) if sla_timer else None,
                    "start_time": str(sla_timer.start_time) if sla_timer else None
                }
            )

        except Exception:
            logger.exception(f"update_status error for ticket {getattr(self, 'ticket_id', '?')}")

    # ------------------------------
    # Broadcast Handler
    # ------------------------------
    async def timer_message(self, event):
        try:
            await self.send(text_data=json.dumps(event))
        except Exception:
            logger.exception(f"timer_message send error for ticket {getattr(self, 'ticket_id', '?')}")

    async def delayed_timer_start(self, delay):
        try:
            await asyncio.sleep(delay)
            # Ensure the DB state updates: activate scheduled SLA
            ticket = await self.get_ticket()
            sla_timer = await self.get_sla_timer(ticket)
            if sla_timer:
                await sync_to_async(sla_timer.activate_scheduled_sla)()
            logger.info(f"[TIMER DELAY COMPLETE] Starting scheduler for Ticket {self.ticket_id}")
            active_timers[self.ticket_id] = asyncio.create_task(self.sla_schedule_loop())
        except asyncio.CancelledError:
            logger.info(f"[TIMER DELAY CANCELLED] Ticket {self.ticket_id}")

