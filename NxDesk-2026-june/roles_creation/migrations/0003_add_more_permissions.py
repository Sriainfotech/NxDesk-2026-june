from django.db import migrations

def add_more_permissions(apps, schema_editor):
    Permission = apps.get_model('roles_creation', 'Permission')

    new_permissions = [
        "create_project_details", "update_project_details", "delete_project_details", "view_project_details",
        "create_project_assignee", "update_project_assignee", "delete_project_assignee", "view_project_assignee",
        "create_history", "update_history", "delete_history", "view_history",
        "create_report", "update_report", "delete_report", "view_report",
        "create_issue_category", "update_issue_category", "delete_issue_category", "view_issue_category",
        "create_issue_type", "update_issue_type", "delete_issue_type", "view_issue_type",
        "close_ticket","updarte_assignment"
        # Add more new permissions here
    ]

    for perm in new_permissions:
        Permission.objects.get_or_create(name=perm)

class Migration(migrations.Migration):

    dependencies = [
        ('roles_creation', '0002_add_new_permissions'),  # Update to your actual last migration
    ]

    operations = [
        migrations.RunPython(add_more_permissions),
    ]
