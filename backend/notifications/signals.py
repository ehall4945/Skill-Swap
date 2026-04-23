from django.db.models.signals import post_save
from django.dispatch import receiver
from django.apps import apps

@receiver(post_save, sender='chat.Message')
def create_message_notification(sender, instance, created, **kwargs):
    """
    Automatically creates a Notification record whenever a new Message is saved.
    """
    if created:
        try:
            Notification = apps.get_model('notifications', 'Notification')
            
            Notification.objects.create(
                recipient=instance.receiver,
                actor=instance.sender,
                verb="sent you a new message",
                target_id=instance.id,
                target_type="message",
                is_read=False
            )
        except Exception as e:
            print(f"NOTIFICATION SIGNAL ERROR: {e}")