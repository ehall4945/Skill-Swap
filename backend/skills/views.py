from rest_framework import generics, permissions
from .models import Skill
from .serializers import SkillSerializer

class SkillListCreateView(generics.ListCreateAPIView):
    """
    Handles listing all skills (GET) and creating a new skill (POST).
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    
    # Only logged-in users can post or see skills
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)