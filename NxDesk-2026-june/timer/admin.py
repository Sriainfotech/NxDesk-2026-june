from django.contrib import admin
from .models import Ticket,SLATimer, WorkingHours, Holiday

# Register your models here.
admin.site.register(Ticket)
admin.site.register(SLATimer)
admin.site.register(WorkingHours)
admin.site.register(Holiday)
# admin.site.register(SLATimeHistory)
