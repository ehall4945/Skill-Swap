from django.db import models
from django.conf import settings

US_STATES = [
    ('AL', 'Alabama'), ('AK', 'Alaska'), ('AZ', 'Arizona'), ('AR', 'Arkansas'),
    ('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'),
    ('FL', 'Florida'), ('GA', 'Georgia'), ('HI', 'Hawaii'), ('ID', 'Idaho'),
    ('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'),
    ('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'),
    ('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MS', 'Mississippi'),
    ('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'),
    ('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'),
    ('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'),
    ('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'),
    ('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'),
    ('VT', 'Vermont'), ('VA', 'Virginia'), ('WA', 'Washington'), ('WV', 'West Virginia'),
    ('WI', 'Wisconsin'), ('WY', 'Wyoming'),
]
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

    location=models.CharField(max_length=2, choices=US_STATES, blank=True, help_text="Select your State", default='WI')

    skills_offered=models.TextField(blank=True, help_text="List the skills you can offer")

    skills_wanted=models.TextField(blank=True, help_text="List the skills you are looking to learn")

    def __str__(self):
        return f"Profile of {self.user.email}"
