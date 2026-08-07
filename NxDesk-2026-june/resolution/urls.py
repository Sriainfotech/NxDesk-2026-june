from django.urls import path
from .views import ResolutionAPIView, ResolutionChoicesAPIView

urlpatterns = [
    path('resolutions/', ResolutionAPIView.as_view(), name='resolution-list-create'),  # GET all, POST
    path('resolutions/<str:ticket_id>/', ResolutionAPIView.as_view(), name='resolution-detail'),  # GET by ID, PUT, DELETE
    path('resolution-choices/', ResolutionChoicesAPIView.as_view(), name='resolution-choices'),

]
