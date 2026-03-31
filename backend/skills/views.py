from django.db.models import Q
from rest_framework import generics, mixins, permissions, viewsets
from .models import Skill, SwapRequest
from .serializers import SkillSerializer, SwapRequestSerializer

class SkillListCreateView(generics.ListCreateAPIView):
    """
    Handles listing all skills (GET) and creating a new skill (POST).
    """
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Skill.objects.select_related("user").order_by("-created_at")
        mine_only = self.request.query_params.get("mine", "").lower()

        if mine_only in {"1", "true", "yes"}:
            return queryset.filter(user=self.request.user)

        return queryset.exclude(user=self.request.user)

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


class SwapRequestViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = SwapRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            SwapRequest.objects
            .filter(
                Q(sender=self.request.user) |
                Q(receiver=self.request.user)
            )
            .select_related("sender", "receiver", "skill")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
