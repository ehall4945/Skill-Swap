from django.contrib import admin
from .models import Conversation, Message, Block


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ['id', 'blocker', 'blocked_user', 'created_at']
    search_fields = ['blocker__email', 'blocked_user__email']
    list_filter = ['created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'participant_emails', 'created_at', 'updated_at']
    filter_horizontal = ['participants']

    def participant_emails(self, obj):
        return ', '.join(p.email for p in obj.participants.all())
    participant_emails.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['content', 'sender__email']

    def content_preview(self, obj):
        return obj.content[:60]
    content_preview.short_description = 'Content'