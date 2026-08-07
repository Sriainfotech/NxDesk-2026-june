from django.apps import AppConfig


class TimerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'timer'

    def ready(self):
        import timer.signals  # Ensure signals are registered
