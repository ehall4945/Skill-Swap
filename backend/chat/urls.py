from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.UserListView.as_view(), name='chat-user-list'),
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', views.StartConversationView.as_view(), name='conversation-start'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),
]