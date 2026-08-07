

from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SolutionGroup, SolutionGroupTickets
from .serializers import SolutionSerializer,SolutionTicketSerializer,TicketgroupSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from organisation_details.models import Organisation
from category.models import Category
from roles_creation.permissions import HasRolePermission
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import SolutionGroup  
from rest_framework.exceptions import PermissionDenied
from timer.serializers import TicketSerializer
from timer.models import Ticket
from django.db.models import Q


class SolutionAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    # def check_permissions(self, request):
    #     """
    #     Check if the user has the required permission.
    #     """
        # if not request.user.has_perm(f"roles_creation.{self.__hash___permission}"):
        #     raise PermissionDenied(f"You do not have permission to {self.has_permission}.")

    def post(self, request, *args, **kwargs):
            self.permission_required = "create_solution_group"  
            HasRolePermission.has_permission(self,request,self.permission_required)
            try:
                if not request.user or not request.user.is_authenticated:
                    return Response(
                        {"error": "Authentication required."},
                        status=status.HTTP_401_UNAUTHORIZED
                    )

                group_name = request.data.get("group_name")
                organisation_id = request.data.get("organisation")
                category_id = request.data.get("category")

                if not organisation_id:
                    return Response({"error": "Organisation ID is required."}, status=status.HTTP_400_BAD_REQUEST)
                if not category_id:
                    return Response({"error": "Category ID is required."}, status=status.HTTP_400_BAD_REQUEST)

                category = Category.objects.select_related("organisation").filter(
                    category_id=category_id, organisation__organisation_id=organisation_id
                ).first()
                if not category:
                    return Response(
                        {"error": f"Category with ID {category_id} does not exist under Organisation {organisation_id}."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                if SolutionGroup.objects.filter(group_name=group_name, category=category).exists():
                    return Response(
                        {"error": "A Solution Group with this name already exists in the selected Category."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                solution_group = SolutionGroup.objects.create(
                    group_name=group_name,
                    category=category,
                    organisation=category.organisation,
                    created_by=request.user,
                    modified_by=request.user
                )

                serializer = SolutionSerializer(solution_group)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            except Exception as e:
                print(f"Error: {str(e)}")
                return Response(
                    {"error": "An unexpected error occurred."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )


    def get(self, request, pk=None):
        self.permission_required = "view_solution_group"  
        HasRolePermission.has_permission(self,request,self.permission_required)

        if pk is not None:
            # Fetch a single solution group
            solution = get_object_or_404(SolutionGroup, pk=pk)
            serializer = SolutionSerializer(solution)
        else:
            # Fetch all solution groups
            solutions = SolutionGroup.objects.all()
            serializer = SolutionSerializer(solutions, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)





   
# class SolutionGroupUpdateView(APIView):  # or the class you're using

    def put(self, request, pk, *args, **kwargs):
        self.permission_required = "update_solution_group"
        HasRolePermission.has_permission(self, request, self.permission_required)

        try:
            solution = SolutionGroup.objects.get(pk=pk)
        except SolutionGroup.DoesNotExist:
            return Response({"error": "Solution not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = SolutionSerializer(solution, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(modified_by=request.user)  # ✅ Only set modified_by
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, solution_id):
        self.permission_required = "delete_solution_group"  
        HasRolePermission.has_permission(self,request,self.permission_required) 
        # Delete an existing solution group
        solution = get_object_or_404(SolutionGroup, pk=solution_id)
        solution.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SolutionGrouopTicketAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, organisation_id=None, employee_id=None):
        # self.permission_required = "view_employee"  
        # HasRolePermission.has_permission(self,request,self.permission_required)

  
        try:
            org=request.user.organization_id
            print(org)
            tickets = SolutionGroupTickets.objects.filter(~Q(ticket_id__developer_organization=org))
            serializer = SolutionTicketSerializer(tickets, many=True)
            print(serializer.data)
            print(len(serializer.data))
            user_to_tickets = defaultdict(list)
            user_to_solution_groups = defaultdict(set)
            all_tickets=[]
            user_list=[]
            for entry in serializer.data:
                user_list.append(entry['username'])
                all_tickets.append(entry['ticket_id'])               
                user_to_tickets[entry['username']].append(entry['ticket_id'])
                user_to_solution_groups[entry['username']].add(entry['solution_group_name'])
            user_to_solution_groups = {k: list(v) for k, v in user_to_solution_groups.items()}
            return Response([user_to_solution_groups,dict(user_to_tickets),{'user_list':list(set(user_list))},{'reference_ID':list(set(all_tickets))}], status=status.HTTP_200_OK)
        except:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
        
        
        
        
        
class SolutionTicketAPI(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request, organisation_id=None, employee_id=None):
        # self.permission_required = "view_employee"  
        # HasRolePermission.has_permission(self,request,self.permission_required)

  
        try:
            group_names = SolutionGroupTickets.objects.filter(user=request.user).values_list('solution_group', flat=True).distinct()
            print(group_names)
            tickets = Ticket.objects.filter(solution_grp__in=group_names,is_active=True)
            serializer_1=TicketSerializer(tickets,many=True)

            
            return Response(serializer_1.data, status=status.HTTP_200_OK)
        except:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
    

from django.db.models import Q, Subquery, OuterRef
from rest_framework.decorators import api_view

@api_view(['GET'])
def search_solution_groups(request):
    query = request.GET.get('q', '')
    subquery_param = request.GET.get('subquery', '')

    solutions = SolutionGroup.objects.all()
    if query:
        solutions = solutions.filter(
            Q(group_name__icontains=query) |
            Q(organisation__organisation_name__icontains=query) |
            Q(created_by__username__icontains=query) |
            Q(modified_by__username__icontains=query)
        )

    if subquery_param:
        subquery = SolutionGroup.objects.filter(
            created_by=OuterRef('created_by'),
            group_name=subquery_param
        ).values('created_by')
        
        solutions = solutions.filter(
            created_by__in=Subquery(subquery)
        )

    serializer = SolutionSerializer(solutions, many=True)
    return Response(serializer.data)
