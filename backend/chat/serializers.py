from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, Block

User = get_user_model()


class UserSummarySerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.email


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSummarySerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at', 'conversation']


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSummarySerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'other_participant',
            'last_message', 'unread_count', 'created_at', 'updated_at',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.last()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()

    def get_other_participant(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        other = obj.get_other_participant(request.user)
        return UserSummarySerializer(other).data if other else None


class StartConversationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User not found.")
        return value


class BlockSerializer(serializers.ModelSerializer):
    blocked_user = UserSummarySerializer(read_only=True)
    blocked_user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Block
        fields = ['id', 'blocked_user', 'blocked_user_id', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_blocked_user_id(self, value):
        request = self.context.get('request')
        if not User.objects.filter(pk=value).exists():
            raise serializers.ValidationError("User not found.")
        if request and value == request.user.pk:
            raise serializers.ValidationError("You cannot block yourself.")
        return value