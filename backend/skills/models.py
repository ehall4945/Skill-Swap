from django.db import models
from django.conf import settings

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
    