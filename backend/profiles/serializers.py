from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    owner_name = serializers.ReadOnlyField(source='user.email')
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)

    class Meta:
        model = Profile
        fields = [
            'id', 
            'owner_name', 
            'user', 
            'first_name',
            'last_name',
            'email',
            'headline', 
            'experience_level', 
            'bio', 
            'location', 
            'skills_offered', 
            'skills_wanted',
            'profile_image',
            'banner_image',
        ]
        read_only_fields = ['user']
        