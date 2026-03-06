from rest_framework import viewsets, permissions
from .models import Profile
from .serializers import ProfileSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing and editing user profiles.
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    
    # Optional: Add permissions so only logged-in users can edit
    # permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        """
        Automatically link the profile to the currently logged-in user.
        """
        serializer.save(user=self.request.user)