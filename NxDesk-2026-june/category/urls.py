from django.urls import path
from .views import CategoryAPIView,search_categories

urlpatterns = [
    path('create/', CategoryAPIView.as_view(), name='CategoryAPI-View'),  # List all and create
    path('cg/<int:id>/', CategoryAPIView.as_view(), name='CategoryAPI-View'),  
    path('category_search/', search_categories, name='search_categories'),
    
]


