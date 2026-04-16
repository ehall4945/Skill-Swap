from django.apps import apps
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import SwapRequest


@receiver(pre_save, sender=SwapRequest)
def cache_previous_swap_request_status(sender, instance, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        return

    try:
        previous = SwapRequest.objects.only("status").get(pk=instance.pk)
        instance._previous_status = previous.status
    except SwapRequest.DoesNotExist:
        instance._previous_status = None


@receiver(post_save, sender=SwapRequest)
def create_swap_request_notifications(sender, instance, created, **kwargs):
    Notification = apps.get_model("notifications", "Notification")

    if created:
        Notification.objects.create(
            recipient=instance.receiver,
            actor=instance.sender,
            verb=f"sent you a new swap request for {instance.skill.title}",
            target_id=instance.pk,
            target_type=Notification.TARGET_REQUEST,
        )
        return

    previous_status = getattr(instance, "_previous_status", None)
    if previous_status == instance.status:
        return

    if instance.status == SwapRequest.STATUS_ACCEPTED:
        Notification.objects.create(
            recipient=instance.sender,
            actor=instance.receiver,
            verb=f"accepted your swap request for {instance.skill.title}",
            target_id=instance.pk,
            target_type=Notification.TARGET_REQUEST,
        )
    elif instance.status == SwapRequest.STATUS_REJECTED:
        Notification.objects.create(
            recipient=instance.sender,
            actor=instance.receiver,
            verb=f"rejected your swap request for {instance.skill.title}",
            target_id=instance.pk,
            target_type=Notification.TARGET_REQUEST,
        )
