from django.urls import path
from . import views
from skills.views import ConnectionListView

urlpatterns = [
    # Users (connections only)
    path('users/', ConnectionListView.as_view(), name='chat-user-list'),

    # Conversations
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/start/', views.StartConversationView.as_view(), name='conversation-start'),

    # Messages
    path('conversations/<int:conversation_id>/messages/', views.MessageListView.as_view(), name='message-list'),

    # Blocks
    path('blocks/', views.BlockListView.as_view(), name='block-list'),
    path('blocks/block/', views.BlockUserView.as_view(), name='block-user'),
    path('blocks/unblock/<int:user_id>/', views.UnblockUserView.as_view(), name='unblock-user'),
]