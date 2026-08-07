from django.contrib import admin
from django.urls import path,include
from .views import HistoryAPI,ReportAPI,AttachmentsAPI

urlpatterns = [
    path('history/', HistoryAPI.as_view(), name='history'),
    path('reports/', ReportAPI.as_view(), name='reports'),
    path('attachments/', AttachmentsAPI.as_view(), name='reports'),
    path('attachments/<str:ticket_id>/', AttachmentsAPI.as_view(), name='reports'),
]
