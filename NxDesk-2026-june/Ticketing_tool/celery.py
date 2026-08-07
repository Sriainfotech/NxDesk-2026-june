
from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
import multiprocessing

# Fix for Windows multiprocessing issues
if os.name == 'nt':  # Only apply for Windows
    multiprocessing.set_start_method('spawn', force=True)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ticketing_tool.settings')
app = Celery('Ticketing_tool')
broker='redis://localhost:6379/0',
backend='redis://localhost:6379/0'
app.conf.enable_utc = False
app.conf.update(timezone='Asia/Kolkata')
app.conf.update(broker_connection_retry_on_startup=True)
# Configure connection retries
app.conf.broker_connection_max_retries = None  # Infinite retries
app.conf.broker_connection_retry = True        # Enable retries

# Optional: Other settings
app.conf.result_backend = 'redis://127.0.0.1:6379/0' 
# app.conf.result_expires = 3600  # 1 hour

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related config keys should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))




