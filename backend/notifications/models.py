from django.conf import settings
from django.db import models


class Notification(models.Model):
    TARGET_REQUEST = "request"
    TARGET_MESSAGE = "message"

    TARGET_TYPE_CHOICES = [
        (TARGET_REQUEST, "Request"),
        (TARGET_MESSAGE, "Message"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications_received",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications_sent",
    )
    verb = models.CharField(max_length=255)
    target_id = models.PositiveIntegerField()
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["recipient", "created_at"]),
        ]

    def __str__(self):
        return f"{self.actor} -> {self.recipient}: {self.verb}"
