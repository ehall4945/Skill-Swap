from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Profile
from .serializers import ProfileSerializer, PublicProfileSerializer
from skills.models import Skill
from skills.serializers import SkillSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing user profiles.
    """
    serializer_class = ProfileSerializer
    # Highly recommended to uncomment this so random people can't edit profiles!
    permission_classes = [permissions.IsAuthenticated]

    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """
        This restricts the list so a user ONLY sees their own profile.
        """
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Automatically link the profile to the currently logged-in user.
        """
        serializer.save(user=self.request.user)


class PublicProfileViewSet(viewsets.ViewSet):
    """
    Read-only public profile endpoint for marketplace/profile browsing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def retrieve(self, request, user_id=None):
        profile = get_object_or_404(
            Profile.objects.select_related("user"),
            user_id=user_id,
        )
        skills = (
            Skill.objects
            .filter(user_id=user_id)
            .select_related("user")
            .order_by("-created_at")
        )

        return Response({
            "profile": PublicProfileSerializer(profile).data,
            "skills": SkillSerializer(skills, many=True).data,
        })
