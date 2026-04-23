import json
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from .models import Conversation, Message
from .serializers import MessageSerializer

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for a single conversation room.
    URL:  ws/chat/<conversation_id>/
    Auth: JWT access token passed as ?token=<jwt> query param.
    """

    async def connect(self):
        # 1. Parse connection parameters
        self.conversation_id = int(self.scope['url_route']['kwargs']['conversation_id'])
        self.room_group_name = f'chat_{self.conversation_id}'

        # 2. Authenticate user via JWT in query string
        user = await self._get_user_from_token()
        if user is None:
            await self.close(code=4001)  # Unauthorized
            return

        # 3. Verify user is actually a participant in this conversation
        is_participant = await self._is_participant(user)
        if not is_participant:
            await self.close(code=4003)  # Forbidden
            return

        # 4. Accept connection and join the conversation group
        self.user = user
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the conversation group
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Handle incoming messages from the WebSocket.
        """
        try:
            data = json.loads(text_data)
        except (TypeError, json.JSONDecodeError):
            return

        msg_type = data.get('type')

        # Handle sending a new message
        if msg_type == 'chat_message':
            content = str(data.get('content') or '').strip()
            if not content:
                return
            
            # Save to DB and get serialized data
            serialized = await self._create_message_payload(content)
            
            # Broadcast to everyone in the room (including sender)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message_event',
                    'conversation_id': self.conversation_id,
                    'message': serialized,
                },
            )

        # Handle a read receipt request
        elif msg_type == 'mark_read':
            updated_count = await self._mark_messages_read()
            if updated_count:
                # Notify others that messages have been read
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'read_receipt_event',
                        'reader_id': int(self.user.pk),
                        'conversation_id': self.conversation_id,
                    },
                )

    # ── Group Event Handlers ──────────────────────────────────────

    async def chat_message_event(self, event):
        """Called when someone sends a message to the group."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'conversation_id': event['conversation_id'],
            'message': event['message'],
        }))

    async def read_receipt_event(self, event):
        """Called when someone marks messages as read in the group."""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'reader_id': event['reader_id'],
            'conversation_id': event['conversation_id'],
        }))

    # ── Database Helpers (Sync to Async) ──────────────────────────

    @database_sync_to_async
    def _get_user_from_token(self):
        """Extracts and validates user from JWT token in query string."""
        query_string = self.scope.get('query_string', b'').decode()
        token_str = parse_qs(query_string).get('token', [None])[0]
        
        if not token_str:
            return None
        
        try:
            token = AccessToken(token_str)
            return User.objects.get(pk=token['user_id'])
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def _is_participant(self, user):
        """Checks if the user belongs to the conversation participants."""
        return Conversation.objects.filter(
            pk=self.conversation_id, 
            participants=user
        ).exists()

    @database_sync_to_async
    def _create_message_payload(self, content):
        """Saves message and returns serialized data for broadcasting."""
        conversation = Conversation.objects.get(pk=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        
        # Update the conversation timestamp to bring it to the top of list
        conversation.save(update_fields=['updated_at'])
        
        # Re-fetch with select_related for serializer performance
        message = Message.objects.select_related('sender').get(pk=message.pk)
        return MessageSerializer(message).data

    @database_sync_to_async
    def _mark_messages_read(self):
        """Marks all messages from other users in this conversation as read."""
        return Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False,
        ).exclude(sender=self.user).update(is_read=True)