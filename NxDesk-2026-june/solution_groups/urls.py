# urls.py
from django.urls import path
from .views import SolutionAPI,search_solution_groups,SolutionGrouopTicketAPI,SolutionTicketAPI

urlpatterns = [
    path('solutionTicket/', SolutionGrouopTicketAPI.as_view(), name='solutionTicket'),  # For listing and creating solutions
    path('tickets/', SolutionTicketAPI.as_view(), name='tickets'),  # For listing and creating solutions

    path('create/', SolutionAPI.as_view(), name='solution-list-create'),  # For listing and creating solutions
    path('solutions/<int:pk>/', SolutionAPI.as_view(), name='solution-detail'),  # For retrieving, updating, deleting a solution
    path('sg_search/', search_solution_groups, name='search_solution_groups'),
]

