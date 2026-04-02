from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q

# Import SwapRequest from your skills app
from skills.models import SwapRequest 

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    StartConversationSerializer,
)

User = get_user_model()

# NOTE: UserListView is removed because we now only allow 
# starting conversations with accepted connections via the Skills app logic.

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
    """Get or create a 1-to-1 conversation with an accepted connection."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        other_user_id = serializer.validated_data['user_id']
        other_user = get_object_or_404(User, pk=other_user_id)

        if other_user == request.user:
            return Response(
                {'detail': 'Cannot start a conversation with yourself.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── SECURITY CHECK ───────────────────────────────────────────
        # Verify that an accepted swap exists between these two users
        has_connection = SwapRequest.objects.filter(
            (Q(sender=request.user, receiver=other_user) | 
             Q(sender=other_user, receiver=request.user)),
            status=SwapRequest.STATUS_ACCEPTED
        ).exists()

        if not has_connection:
            return Response(
                {'detail': 'You can only message users you have an accepted swap with.'},
                status=status.HTTP_403_FORBIDDEN
            )
        # ─────────────────────────────────────────────────────────────

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
        