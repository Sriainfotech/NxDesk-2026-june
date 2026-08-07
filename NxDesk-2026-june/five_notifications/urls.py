from django.urls import path
from .views import AppreciationAPIView,AnnouncementAPIView,RecentItemView,OpenItemsAPIView,PopularItemsAPIView  

urlpatterns = [
    path('announcements/', AnnouncementAPIView.as_view(), name='announcement_list'),
    path('announcements/<int:pk>/', AnnouncementAPIView.as_view(), name='announcement_detail'),
    path('appreciations/', AppreciationAPIView.as_view(), name='appreciation_list'),
    path('appreciations/<int:pk>/', AppreciationAPIView.as_view(), name='appreciation_detail'),
    path('recent-items/', RecentItemView.as_view(), name='recent-items'),
    path('open-items/',OpenItemsAPIView.as_view(), name='open-items'),
    path('popular-items/',PopularItemsAPIView.as_view(), name='popular-items'),
]
 
