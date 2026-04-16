from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from chat.models import Message

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    """
    Automatically creates a Notification record whenever a new Message is saved.
    """
    if created:
        Notification.objects.create(
            recipient=instance.receiver,
            actor=instance.sender,
            verb="sent you a new message",
            target_id=instance.id,
            target_type="message",
            is_read=False
        )