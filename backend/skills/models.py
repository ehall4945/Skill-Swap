from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Skill(models.Model):

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skills')

    SKILL_TYPE_CHOICES = [
        ('OFFER', 'offer'),
        ('REQUEST', 'request'),
    ]

    title = models.CharField(max_length=100)

    description = models.TextField(max_length=500)

    category = models.CharField(max_length=50, blank=True, help_text="e.g. Programming, Music, Cooking")

    skill_type = models.CharField(max_length=7, choices=SKILL_TYPE_CHOICES, default='OFFER')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_skill_type_display()})"


class SwapRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
    ]

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_swap_requests",
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_swap_requests",
    )
    skill = models.ForeignKey(
        Skill,
        on_delete=models.CASCADE,
        related_name="swap_requests",
    )
    status = models.CharField(
        max_length=8,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ('sender', 'skill')

    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError("You cannot request a swap for your own skill.")

    def __str__(self):
        sender_id = getattr(self.sender, 'username', self.sender.email)
        return f"{sender_id} -> {self.skill.title} [{self.status}]"
        