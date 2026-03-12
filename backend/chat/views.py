from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    StartConversationSerializer,
    UserSummarySerializer,
)

User = get_user_model()


class UserListView(generics.ListAPIView):
    """List all other active users (for starting a new conversation)."""
    serializer_class = UserSummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.exclude(pk=self.request.user.pk).filter(is_active=True)


class ConversationListView(generics.ListAPIView):
    """List all conversations for the authenticated user."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class StartConversationView(APIView):
    """Get or create a 1-to-1 conversation with another user."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        other_user = get_object_or_404(User, pk=serializer.validated_data['user_id'])

        if other_user == request.user:
            return Response(
                {'detail': 'Cannot start a conversation with yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation, created = Conversation.get_or_create_between(request.user, other_user)
        out = ConversationSerializer(conversation, context={'request': request})
        return Response(
            out.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MessageListView(generics.ListAPIView):
    """List messages in a conversation and mark them as read."""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation = get_object_or_404(
            Conversation,
            pk=self.kwargs['conversation_id'],
            participants=self.request.user,
        )
        # Mark incoming messages as read
        conversation.messages.filter(is_read=False).exclude(
            sender=self.request.user
        ).update(is_read=True)

        return conversation.messages.select_related('sender')