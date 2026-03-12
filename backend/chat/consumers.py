import json
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
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        user = await self._get_user_from_token()
        if user is None:
            await self.close(code=4001)
            return

        is_participant = await self._is_participant(user)
        if not is_participant:
            await self.close(code=4003)
            return

        self.user = user
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')

        if msg_type == 'chat_message':
            content = data.get('content', '').strip()
            if not content:
                return
            message = await self._save_message(content)
            serialized = await self._serialize_message(message)
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'chat_message_event', 'message': serialized},
            )

        elif msg_type == 'mark_read':
            await self._mark_messages_read()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'read_receipt_event',
                    'reader_id': self.user.pk,
                    'conversation_id': self.conversation_id,
                },
            )

    async def chat_message_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
        }))

    async def read_receipt_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'reader_id': event['reader_id'],
            'conversation_id': event['conversation_id'],
        }))

    # ── DB helpers ────────────────────────────────────────────────

    @database_sync_to_async
    def _get_user_from_token(self):
        query_string = self.scope.get('query_string', b'').decode()
        params = dict(pair.split('=') for pair in query_string.split('&') if '=' in pair)
        token_str = params.get('token')
        if not token_str:
            return None
        try:
            token = AccessToken(token_str)
            return User.objects.get(pk=token['user_id'])
        except (InvalidToken, TokenError, User.DoesNotExist):
            return None

    @database_sync_to_async
    def _is_participant(self, user):
        return Conversation.objects.filter(
            pk=self.conversation_id, participants=user
        ).exists()

    @database_sync_to_async
    def _save_message(self, content):
        conversation = Conversation.objects.get(pk=self.conversation_id)
        msg = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content,
        )
        conversation.save(update_fields=['updated_at'])
        return msg

    @database_sync_to_async
    def _serialize_message(self, message):
        message = Message.objects.select_related('sender').get(pk=message.pk)
        return MessageSerializer(message).data

    @database_sync_to_async
    def _mark_messages_read(self):
        Message.objects.filter(
            conversation_id=self.conversation_id,
            is_read=False,
        ).exclude(sender=self.user).update(is_read=True)