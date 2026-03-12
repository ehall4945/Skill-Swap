from django.db import models
from django.conf import settings


class Conversation(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        names = ', '.join(str(p) for p in self.participants.all())
        return f"Conversation({names})"

    def get_other_participant(self, user):
        return self.participants.exclude(pk=user.pk).first()

    @classmethod
    def get_or_create_between(cls, user_a, user_b):
        shared = (
            cls.objects
            .filter(participants=user_a)
            .filter(participants=user_b)
        )
        for conv in shared:
            if conv.participants.count() == 2:
                return conv, False
        conv = cls.objects.create()
        conv.participants.add(user_a, user_b)
        return conv, True


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.conversation_id}] {self.sender}: {self.content[:40]}"