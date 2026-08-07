
import itertools
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from login_details.models import User
from organisation_details.models import Organisation, Employee
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.shortcuts import get_object_or_404
from organisation_details.serializers import OrganisationSerializer
from organisation_details.tasks import send_organisation_creation_email
from project_details.serializers import ProjectsDashSerializer,ProjectsSerializer,ProjectsMembersSerializer
from roles_creation.permissions import HasRolePermission
from .models import ProjectsDetails,ProjectMember, ProjectAttachment
from django.core.files.storage import default_storage



import logging

logger = logging.getLogger(__name__)
 
class ProjectDetailsAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   
    def post(self, request):
        self.permission_required = "create_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)

        files = request.FILES.getlist('files')  # expecting form-data key 'files'

        serializer = ProjectsSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(
                created_by=request.user,
                organisation=request.user.organisation
            )

            # Save each attachment using the correct model field name
            for file in files:
                ProjectAttachment.objects.create(
                    project=project,
                    files=file,  # ✅ corrected here
                    uploaded_by=request.user
                )

            return Response(ProjectsSerializer(project).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    


    def get(self, request, project_id=None):
        self.permission_required = "view_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        try:
            ids = Employee.objects.values_list(
                'user_role_id__user_id__username', flat=True
            ).distinct()

            if project_id:
                project = get_object_or_404(ProjectsDetails, pk=project_id)
                serializer = ProjectsSerializer(project)
                return Response(serializer.data, status=status.HTTP_200_OK)

            projects = ProjectsDetails.objects.all()
            serializer = ProjectsSerializer(projects, many=True)

            project_members = ProjectMember.objects.all()
            project_members_serializer = ProjectsMembersSerializer(project_members, many=True)

            final_data = [{'all_project': serializer.data}]

            result = [
                {
                    "name": k,
                    "assigned_projects": [d["project_name"] for d in v]
                }
                for k, v in itertools.groupby(
                    sorted(project_members_serializer.data, key=lambda x: x["project_asignees"]),
                    key=lambda x: x["project_asignees"]
                )
            ]

            final_data.append({'assigned_projects': result})
            final_data.append({'requestor_ids': list(ids)})

            return Response(final_data)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


        
    def put(self, request, project_id):
        self.permission_required = "update_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        resolution = get_object_or_404(ProjectsDetails, pk=project_id)
        serializer = ProjectsSerializer(resolution, data=request.data, partial=True)

        if serializer.is_valid():
            updated_project = serializer.save(modified_by=request.user)

            # Handle attachments
            uploaded_files = request.FILES.getlist('files')  # 'files' must match the form input name

            for file in uploaded_files:
                ProjectAttachment.objects.create(
                    project=updated_project,
                    files=file,  # ✅ correct keyword for the model's field
                    uploaded_by=request.user
                )

            return Response(ProjectsSerializer(updated_project).data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class ProjectDashDetailsAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   
    
  
    def get(self, request, project_id=None):
        self.permission_required = "view_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        try:
            projects = ProjectsDetails.objects.all()
            serializer = ProjectsDashSerializer(projects, many=True)
            return Response(serializer.data)  
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    



class UserProjectDetailsAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
   


    def get(self, request, projects_id=None):
        self.permission_required = "view_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        user_org = request.user.organisation
        if not user_org:
            return Response({"error": "User's organisation is not set."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project_members = ProjectMember.objects.filter(project_asignee=request.user.id)
            project_members_serializer = ProjectsMembersSerializer(project_members, many=True)

            final_data = list({i['project_name_name'] for i in project_members_serializer.data})
            return Response(final_data)

        except Organisation.DoesNotExist:
            return Response({"error": "Organisation not found."}, status=status.HTTP_404_NOT_FOUND)




class ProjectMemberAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, project_id=None):
        self.permission_required = "view_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
          return Response({'error': 'Permission denied.'}, status=403)
        try:
            if project_id:
                project_members = ProjectMember.objects.filter(project_name=project_id)
                serializer = ProjectsMembersSerializer(project_members, many=True)
                return Response(serializer.data, status=status.HTTP_200_OK)

            project_members = ProjectMember.objects.all()
            serializer = ProjectsMembersSerializer(project_members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProjectMember.DoesNotExist:
            return Response({"error": "Project members not found."}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request):    
        self.permission_required = "create_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)

        print("Incoming data:", request.data)  # 👈 Add this line to inspect data

        serializer = ProjectsMembersSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user, modified_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put (self, request, assigned_project_id):
        self.permission_required = "update_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            project_member = get_object_or_404(ProjectMember, pk=assigned_project_id)
            serializer = ProjectsMembersSerializer(project_member, data=request.data, partial=True)
 
            if serializer.is_valid():
                updated_project_member = serializer.save(modified_by=request.user)
                return Response(ProjectsMembersSerializer(updated_project_member).data, status=status.HTTP_200_OK)
 
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ProjectMember.DoesNotExist:
            return Response({"error": "Project member not found."}, status=status.HTTP_404_NOT_FOUND)
        
    def delete(self, request, assigned_project_id):
        self.permission_required = "delete_project_details"
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=403)
        try:
            project_member = get_object_or_404(ProjectMember, pk=assigned_project_id)
            project_member.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectMember.DoesNotExist:
            return Response({"error": "Project member not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
 


    





