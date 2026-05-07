from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import exceptions
from rest_framework import generics, mixins, permissions, viewsets
from .models import Skill, SwapRequest, DismissedSkill
from .permissions import IsRequestParticipant
from .serializers import ConnectionSerializer, SkillSerializer, SwapRequestSerializer, DismissedSkillSerializer

User = get_user_model()

class SkillListCreateView(generics.ListCreateAPIView):
    serializer_class = SkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Skill.objects
            .select_related("user", "user__profile")
            .order_by("-created_at")
        )
        mine_only = self.request.query_params.get("mine", "").lower()
        discover_only = self.request.query_params.get("discover", "").lower()

        if mine_only in {"1", "true", "yes"}:
            return queryset.filter(user=self.request.user)

        queryset = queryset.exclude(user=self.request.user)

        if discover_only in {"1", "true", "yes"}:
            requested_skill_ids = SwapRequest.objects.filter(
                sender=self.request.user,
            ).values_list("skill_id", flat=True)

            dismissed_skill_ids = DismissedSkill.objects.filter(
                user=self.request.user,
            ).values_list("skill_id", flat=True)

            return queryset.filter(
                user__is_active=True,
                skill_type="OFFER",
            ).exclude(
                id__in=list(requested_skill_ids) + list(dismissed_skill_ids)
            )

        return queryset

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
    permission_classes = [permissions.IsAuthenticated, IsRequestParticipant]

    def get_queryset(self):
        queryset = (
            SwapRequest.objects
            .select_related("sender", "receiver", "skill")
            .order_by("-created_at")
        )

        if self.action == "list":
            return queryset.filter(
                Q(sender=self.request.user) |
                Q(receiver=self.request.user)
            )

        return queryset

    def perform_create(self, serializer):
        receiver = serializer.validated_data["receiver"]

        if receiver == self.request.user:
            raise exceptions.ValidationError({
                "receiver": "You cannot send a swap request to yourself."
            })

        incoming_request = SwapRequest.objects.filter(
            sender=receiver,
            receiver=self.request.user,
            status=SwapRequest.STATUS_PENDING,
        ).first()

        if incoming_request:
            incoming_request.status = SwapRequest.STATUS_ACCEPTED
            incoming_request.save(update_fields=["status"])
            return

        serializer.save(sender=self.request.user)

    def _validate_status_transition(self, instance, requested_status):
        if requested_status is None:
            return

        if (
            instance.status == SwapRequest.STATUS_ACCEPTED
            and requested_status == SwapRequest.STATUS_PENDING
        ):
            raise exceptions.ValidationError({
                "status": "Accepted requests cannot be changed back to pending."
            })

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._validate_status_transition(instance, request.data.get("status"))
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        self._validate_status_transition(instance, request.data.get("status"))
        return super().partial_update(request, *args, **kwargs)

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
        
#Dismissed skills, so old swipes don't reappear on page refresh/reload
class DismissedSkillCreateView(generics.CreateAPIView):
    serializer_class = DismissedSkillSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)