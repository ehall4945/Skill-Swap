from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20

        limit = max(1, min(limit, 100))
        queryset = (
            Notification.objects
            .filter(recipient=request.user)
            .select_related("actor", "recipient")
            .order_by("-created_at")
        )

        unread_count = queryset.filter(is_read=False).count()
        serializer = NotificationSerializer(queryset[:limit], many=True)

        return Response({
            "count": queryset.count(),
            "unread_count": unread_count,
            "results": serializer.data,
        })


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        notification = get_object_or_404(
            Notification.objects.select_related("actor", "recipient"),
            pk=pk,
            recipient=request.user,
        )

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read"])

        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)
