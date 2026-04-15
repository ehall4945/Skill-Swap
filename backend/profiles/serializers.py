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


class PublicProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    full_name = serializers.SerializerMethodField()
    location_display = serializers.SerializerMethodField()
    experience_level_display = serializers.CharField(
        source="get_experience_level_display",
        read_only=True,
    )

    class Meta:
        model = Profile
        fields = [
            "user",
            "first_name",
            "last_name",
            "full_name",
            "headline",
            "experience_level",
            "experience_level_display",
            "bio",
            "location",
            "location_display",
            "skills_offered",
            "skills_wanted",
            "profile_image",
            "banner_image",
        ]
        read_only_fields = [
            "user",
            "first_name",
            "last_name",
            "full_name",
            "headline",
            "experience_level",
            "experience_level_display",
            "bio",
            "location",
            "location_display",
            "skills_offered",
            "skills_wanted",
            "profile_image",
            "banner_image",
        ]

    def get_full_name(self, obj):
        full_name = obj.user.get_full_name().strip()
        return full_name or "Community Member"

    def get_location_display(self, obj):
        return obj.get_location_display() if obj.location else ""
        
