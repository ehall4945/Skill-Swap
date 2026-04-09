from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, mixins, permissions, viewsets
from .models import Skill, SwapRequest
from .serializers import ConnectionSerializer, SkillSerializer, SwapRequestSerializer

User = get_user_model()

class SkillListCreateView(generics.ListCreateAPIView):
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
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
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

class ConnectionListView(generics.ListAPIView):
    serializer_class = ConnectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        accepted_requests = (
            SwapRequest.objects
            .filter(
                Q(sender=user) | Q(receiver=user),
                status=SwapRequest.STATUS_ACCEPTED,
            )
            .select_related("sender", "receiver")
        )

        connection_ids = {
            request.receiver_id if request.sender_id == user.id else request.sender_id
            for request in accepted_requests
        }

        return User.objects.filter(
            id__in=connection_ids,
            is_active=True,
        ).order_by("first_name", "last_name", "email")
        