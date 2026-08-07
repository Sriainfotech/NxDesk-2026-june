from django.contrib import admin
from .models import Notification,Announcement,Appreciation,OpenItem 
# Register your models here.
admin.site.register(Notification)
admin.site.register(Appreciation)
admin.site.register(Announcement)
admin.site.register(OpenItem)
