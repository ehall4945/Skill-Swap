from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = Profile
        fields = [
            'id', 
            'owner_name', 
            'user', 
            'headline', 
            'experience_level', 
            'bio', 
            'location', 
            'skills_offered', 
            'skills_wanted'
        ]
        # We make 'user' read-only so it's handled by the backend logic, not the user input
        read_only_fields = ['user']