from rest_framework import generics, permissions
from .models import Skill
from .serializers import SkillSerializer

class SkillListCreateView(generics.ListCreateAPIView):
    """
    Handles listing all skills (GET) and creating a new skill (POST).
    """
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Limit the list endpoint to the signed-in user's own skills so the
        profile page only receives the current user's records.
        """
        return (
            Skill.objects
            .filter(user=self.request.user)
            .select_related("user")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SkillDetailView(generics.DestroyAPIView):
    """
    Handles deleting a specific skill (DELETE /skills/id/).
    """
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Security: Users can only delete skills they own
        return Skill.objects.filter(user=self.request.user)