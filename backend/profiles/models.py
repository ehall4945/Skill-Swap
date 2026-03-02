from django.db import models
from django.conf import settings
class Profile (models.Model):
    #Creates a link between the profile and the user model
    user=models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile') 

    EXPERIENCE_LEVELS = [
        ('BEG', 'Beginner'),
        ('INT', 'Intermediate'),
        ('ADV', 'Advanced'),
        ('EXP', 'Expert'),
    ]

    headline=models.CharField(max_length=100, blank=True, help_text="A brief headline about your skills or interests.")

    experience_level=models.CharField(max_length=3, choices=EXPERIENCE_LEVELS, default='BEG', help_text="Select your experience level")

    bio=models.TextField(blank=True, help_text="A detailed description of your skills and interests.")

    location=models.CharField(max_length=100, blank=True, help_text="e.g., Milwaukee, WI")

    skills_offered=models.TextField(blank=True, help_text="List the skills you can offer")

    skills_wanted=models.TextField(blank=True, help_text="List the skills you are looking to learn")

    def __str__(self):
        return f"(self.user.username) Profile"
