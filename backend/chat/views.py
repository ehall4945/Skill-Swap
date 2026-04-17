from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.db.models import Q

from skills.models import SwapRequest
from .models import Conversation, Message, Block
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    StartConversationSerializer,
    BlockSerializer,
)

User = get_user_model()


def get_blocked_user_ids(user):
    """
    Returns a set of user IDs that have any block relationship with the given user.
    Includes users the current user has blocked AND users who have blocked them.
    """
    blocked_by_me = Block.objects.filter(blocker=user).values_list('blocked_user_id', flat=True)
    blocked_me    = Block.objects.filter(blocked_user=user).values_list('blocker_id', flat=True)
    return set(blocked_by_me) | set(blocked_me)


class ConversationListView(generics.ListAPIView):
    """List conversations, hiding any that involve a blocked user."""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        excluded = get_blocked_user_ids(self.request.user)
        return (
            Conversation.objects
            .filter(participants=self.request.user)
            .exclude(participants__in=excluded)
            .prefetch_related('participants', 'messages')
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class StartConversationView(APIView):
    """
    Get or create a 1-to-1 conversation with an accepted connection.
    Blocked users cannot be messaged.
    """
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

        # Check for block in either direction
        block_exists = Block.objects.filter(
            Q(blocker=request.user, blocked_user=other_user) |
            Q(blocker=other_user, blocked_user=request.user)
        ).exists()

        if block_exists:
            return Response(
                {'detail': 'You cannot message this user.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verify accepted swap exists between these two users
        has_connection = SwapRequest.objects.filter(
            (Q(sender=request.user, receiver=other_user) |
             Q(sender=other_user, receiver=request.user)),
            status=SwapRequest.STATUS_ACCEPTED
        ).exists()

        if not has_connection:
            return Response(
                {'detail': 'You can only message users you have an accepted swap with.'},
                status=status.HTTP_403_FORBIDDEN,
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
        conversation.messages.filter(is_read=False).exclude(
            sender=self.request.user
        ).update(is_read=True)
        return conversation.messages.select_related('sender')


# ── Block views ────────────────────────────────────────────────────

class BlockListView(generics.ListAPIView):
    """List all users the authenticated user has blocked."""
    serializer_class = BlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Block.objects.filter(blocker=self.request.user).select_related('blocked_user')


class BlockUserView(APIView):
    """Block a user by their ID."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BlockSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        blocked_user = get_object_or_404(User, pk=serializer.validated_data['blocked_user_id'])

        block, created = Block.objects.get_or_create(
            blocker=request.user,
            blocked_user=blocked_user,
        )

        if not created:
            return Response(
                {'detail': 'You have already blocked this user.'},
                status=status.HTTP_200_OK,
            )

        return Response(
            BlockSerializer(block, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class UnblockUserView(APIView):
    """Unblock a user by their ID."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        block = get_object_or_404(
            Block,
            blocker=request.user,
            blocked_user_id=user_id,
        )
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)