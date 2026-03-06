from rest_framework import serializers
from .models import Skill

class SkillSerializer(serializers.ModelSerializer):

    owner_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Skill
        fields = [
            'id', 
            'owner_name',
            'user',       
            'title', 
            'description', 
            'category', 
            'skill_type', 
            'created_at'
        ]
        
        read_only_fields = ['user']