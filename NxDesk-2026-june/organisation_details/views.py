
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Organisation, Employee
from .serializers import AssigneeSerializer,OrganisationSerializer, EmployeeSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from organisation_details.tasks import send_organisation_creation_email
from roles_creation.permissions import HasRolePermission


import logging

logger = logging.getLogger(__name__)

class OrganisationAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   
    
    def get(self, request, organisation_id=None):
        self.permission_required = "view_organization"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        print("done")

        logger.info("OrganizationList view was called")
       
        if organisation_id:
            try:
                organisation = Organisation.objects.get(organisation_id=organisation_id)
                serializer = OrganisationSerializer(organisation)
                return Response(serializer.data)
            except Organisation.DoesNotExist:
                return Response({"error": "Organisation not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            organisations = Organisation.objects.all()
            serializer = OrganisationSerializer(organisations, many=True)
            return Response(serializer.data)
        
    
    

    # POST: Create a new organisation 
    def post(self, request):
        self.permission_required = "create_organization"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)

       
        serializer = OrganisationSerializer(data=request.data)
        if serializer.is_valid():
            organisation = serializer.save(created_by=request.user)
            send_organisation_creation_email.delay(
                organisation.organisation_name,
                organisation.organisation_mail
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # PUT: Update an existing organisation
    def put(self, request, organisation_id=None):
        self.permission_required = "update_organization"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        try:
            organisation = Organisation.objects.get(organisation_id=organisation_id)
        except Organisation.DoesNotExist:


            
            return Response({"error": "Organisation not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = OrganisationSerializer(organisation, data=request.data, partial=True)
        if serializer.is_valid():
            organisation = serializer.save(modified_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE: Delete an organisation
    def delete(self, request, organisation_id=None):
        self.permission_required = "delete_organization"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
         return Response({'error': 'Permission denied.'}, status=403)
        try:
            organisation = Organisation.objects.get(organisation_id=organisation_id)
            organisation.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Organisation.DoesNotExist:
            return Response({"error": "Organisation not found."}, status=status.HTTP_404_NOT_FOUND)
        

class TreeEmployeeAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, organisation_id=None, employee_id=None):
    #     self.permission_required = "view_employee_tree"
    
        # if not HasRolePermission().has_permission(request, self.permission_required):
        #     return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)


        organisation_id= request.user.organisation
        if organisation_id:
            print(organisation_id)
            employees = Employee.objects.filter(organisation_id=organisation_id)
            serializer = EmployeeSerializer(employees, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
    

class autoAssigneeAPIView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, organisation_id=None, employee_id=None):
        self.permission_required = "view_employee"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if 1:
            employees = Employee.objects.all()
            serializer = AssigneeSerializer(employees, many=True)
            result = []
            for user in serializer.data:
                transformed_user = {
                    "username": user["username"],
                    "organisation_name": user["organisation_name"],
                    "solutiongroup": [sg["solution_group_name"] for sg in user["solutiongroup"]]
                }
                result.append(transformed_user)
                    
                    
            return Response(result, status=status.HTTP_200_OK)


        return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
    


from roles_creation.models import UserRole

class EmployeeAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
 
    
    def get(self, request, organisation_id=None, employee_id=None):
        self.permission_required = "view_employee"
 
        if not HasRolePermission.has_permission(self, request, self.permission_required):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
 
        user = request.user
 
        # Get all roles
        user_roles = UserRole.objects.filter(user=user)
        if not user_roles.exists():
            return Response({"error": "UserRole not found."}, status=status.HTTP_403_FORBIDDEN)
 
        user_role = user_roles.first()  # use first role if multiple
 
        # Is user a superadmin?
        is_superadmin = getattr(user, 'is_superadmin', False)
 
        # Try to get current employee's org (if not superadmin)
        current_org_id = None
        if not is_superadmin:
            try:
                current_employee = Employee.objects.get(user_role=user_role)
                current_org_id = current_employee.organisation_id
            except Employee.DoesNotExist:
                return Response({"error": "Employee record not found for this user."}, status=status.HTTP_403_FORBIDDEN)
 
        print(f"User: {user.username}, SuperAdmin: {is_superadmin}")
        print(f"Requested Org ID: {organisation_id}, Requested Employee ID: {employee_id}")
 
        # Case: Get single employee
        if employee_id:
            try:
                employee = Employee.objects.get(employee_id=employee_id)
                if not is_superadmin and employee.organisation_id != current_org_id:
                    return Response({"error": "Access denied to this employee."}, status=status.HTTP_403_FORBIDDEN)
                serializer = EmployeeSerializer(employee)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Employee.DoesNotExist:
                return Response({"error": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)
 
        # Tree building helper function
        def build_tree(data, parent_id=None):
            tree = []
            for item in data:
                if item['parent'] == parent_id:
                    children = build_tree(data, item['employee_id'])
                    if children:
                        item['children'] = children
                    tree.append(item)
            return tree
 
        # Case: SuperAdmin gets all employees
        if is_superadmin and not organisation_id:
            employees = Employee.objects.all()
            serializer = EmployeeSerializer(employees, many=True)
            tree_data = build_tree(serializer.data)
            return Response(tree_data, status=status.HTTP_200_OK)
 
        # Case: Normal user (or superadmin) requesting employees from specific organisation
        org_id_to_use = organisation_id or current_org_id
        if not is_superadmin and org_id_to_use != current_org_id:
            return Response({"error": "Access denied to this organisation."}, status=status.HTTP_403_FORBIDDEN)
 
        employees = Employee.objects.filter(organisation_id=org_id_to_use)
        serializer = EmployeeSerializer(employees, many=True)
        tree_data = build_tree(serializer.data)
        return Response(tree_data, status=status.HTTP_200_OK)
 
 
 
   
 
    def post(self, request, organisation_id=None):
        self.permission_required = "create_employee"  
        HasRolePermission.has_permission(self,request,self.permission_required)
        """
        Create an employee. If `organisation_id` is provided in the URL,
        it will automatically associate the employee with that organisation.
        """
        if organisation_id:
            # Attach organisation ID from URL if provided
            request.data["organisation"] = organisation_id
 
        serializer = EmployeeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
       
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
   
    def put(self, request, employee_id):
        self.permission_required = "update_employee"
        if not HasRolePermission.has_permission(self, request, self.permission_required):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
 
        employee = get_object_or_404(Employee, employee_id=employee_id)
 
        # Copy and modify data to convert `parent=0` to `None`
        data = request.data.copy()
        if str(data.get("parent")) == "0":
            data["parent"] = None
 
        serializer = EmployeeSerializer(employee, data=data, partial=True)
        if serializer.is_valid():
            serializer.save(modified_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 
    def delete(self, request, employee_id):
        self.permission_required = "delete_employee"  
        HasRolePermission.has_permission(self,request,self.permission_required)
        employee = get_object_or_404(Employee, id=employee_id)
        employee.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


from .utils import get_all_organisation_hierarchies
class SuperAdminHierarchyView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   
 
    def get(self, request):
        user = request.user
 
        # Check if user is superadmin (customize this check)
        if not user.is_superuser:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
 
        data = get_all_organisation_hierarchies()
        return Response(data)
 
 
 
 
 
 