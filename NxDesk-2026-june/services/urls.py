# urls.py
from django.urls import path
from .views import IssueCategoryListAPIView, IssueTypeListAPIView

urlpatterns = [
    path('categories/', IssueCategoryListAPIView.as_view(), name='category-list'),
    path('categories/<int:pk>/', IssueCategoryListAPIView.as_view(), name='category-list'),
    path('issue-types/', IssueTypeListAPIView.as_view(), name='issue-type-list'),
    path('issue-types/<int:issue_type_id>/', IssueTypeListAPIView.as_view(), name='issue-type-list')
]
