# your_app/utils.py
 
from .models import Employee
 
def build_hierarchy(employee):
    children = Employee.objects.filter(parent=employee)
    return {
        "employee_id": employee.employee_id,  # your PK field is employee_id
       
        "username": employee.user_role.user.username if employee.user_role and employee.user_role.user else None,
        "organisation_name": employee.organisation.organisation_name,
        "user_role": employee.user_role_id,
        "organisation": employee.organisation_id,
        "position_name": employee.position_name,
        "level": employee.level,
        "parent": employee.parent.employee_id if employee.parent else None,
        "created_at": employee.created_at,
        "modified_at": employee.modified_at,
        "created_by": employee.created_by.id if employee.created_by else None,
        "modified_by": employee.modified_by.id if employee.modified_by else None,
        "children": [build_hierarchy(child) for child in children]
    }
 
 
def get_all_organisation_hierarchies():
    from .models import Organisation  # Optional: move to top
 
    all_trees = []
    for org in Organisation.objects.all():
        root_employees = Employee.objects.filter(organisation=org, parent=None)
        for emp in root_employees:
            all_trees.append(build_hierarchy(emp))
    return all_trees
 
 