from rest_framework import viewsets, permissions
from .models import Profile
from .serializers import ProfileSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing user profiles.
    """
    serializer_class = ProfileSerializer
    # Highly recommended to uncomment this so random people can't edit profiles!
    permission_classes = [permissions.IsAuthenticated]

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