from django.test import TestCase
from core.models import CustomUser as User
from .models import Profile

class ProfileModelTests(TestCase):
    def setUp(self):
        # Create a user without a username, just email & password
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpassword123"
        )
        # Create the associated profile
        self.profile = Profile.objects.create(user=self.user)

    def test_profile_creation(self):
        """Test that a profile is created correctly."""
        self.assertIsInstance(self.profile, Profile)
        self.assertEqual(self.profile.user, self.user)

    def test_profile_user_relationship(self):
        """Test OneToOne relationship between User and Profile."""
        self.assertEqual(self.user.profile, self.profile)

    def test_profile_default_experience_level(self):
        """Test default experience level is Beginner."""
        profile = Profile.objects.create(user=User.objects.create_user(
            email="newuser@example.com",
            password="password456"
        ))
        self.assertEqual(profile.experience_level, 'BEG')

    def test_experience_level_choices(self):
        """Ensure experience level choices are valid."""
        choices = [choice[0] for choice in Profile.EXPERIENCE_LEVELS]
        self.assertIn(self.profile.experience_level, choices)

    def test_profile_fields_saved_correctly(self):
        """Test that all fields save properly."""
        self.profile.headline = "My Skills"
        self.profile.bio = "I love coding."
        self.profile.location = "Milwaukee, WI"
        self.profile.skills_offered = "Python, Django"
        self.profile.skills_wanted = "React, Docker"
        self.profile.save()

        profile = Profile.objects.get(user=self.user)
        self.assertEqual(profile.headline, "My Skills")
        self.assertEqual(profile.bio, "I love coding.")
        self.assertEqual(profile.location, "Milwaukee, WI")
        self.assertEqual(profile.skills_offered, "Python, Django")
        self.assertEqual(profile.skills_wanted, "React, Docker")

    def test_string_representation(self):
        """Test __str__ method."""
        self.assertEqual(str(self.profile), f"{self.user.email} Profile")