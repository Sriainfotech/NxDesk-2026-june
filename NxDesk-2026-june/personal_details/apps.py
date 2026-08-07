from django.apps import AppConfig


class PersonalDetailsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'personal_details'

    def ready(self):
        import personal_details.signals  # Ensure signals are imported and connected
 
