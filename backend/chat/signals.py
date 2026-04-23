from django.apps import apps
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Message


@receiver(post_save, sender=Message)
def create_message_notifications(sender, instance, created, **kwargs):
    if not created:
        return

    Notification = apps.get_model("notifications", "Notification")
    recipients = instance.conversation.participants.exclude(pk=instance.sender_id)

    notifications = [
        Notification(
            recipient=recipient,
            actor=instance.sender,
            verb="sent you a new message",
            target_id=instance.conversation_id,
            target_type=Notification.TARGET_MESSAGE,
        )
        for recipient in recipients
    ]

    if notifications:
        Notification.objects.bulk_create(notifications)
