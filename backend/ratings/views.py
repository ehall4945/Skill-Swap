from django.contrib.auth import get_user_model
from django.db.models import Avg, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from skills.models import SwapRequest
from .models import Rating
from .serializers import RatingSerializer

User = get_user_model()


def users_have_accepted_match(user_a, user_b):
    return SwapRequest.objects.filter(
        Q(sender=user_a, receiver=user_b) | Q(sender=user_b, receiver=user_a),
        status=SwapRequest.STATUS_ACCEPTED,
    ).exists()


class RatingListCreateView(generics.ListCreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Rating.objects
            .select_related("user", "reviewer")
            .filter(Q(user=self.request.user) | Q(reviewer=self.request.user))
            .order_by("-updated_at")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rated_user = serializer.validated_data["user"]
        rating_value = serializer.validated_data["rating"]
        review_text = serializer.validated_data.get("name", "")

        if rated_user == request.user:
            return Response(
                {"detail": "You cannot rate yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not users_have_accepted_match(request.user, rated_user):
            return Response(
                {"detail": "You can only rate users you have matched with."},
                status=status.HTTP_403_FORBIDDEN,
            )

        rating, created = Rating.objects.update_or_create(
            reviewer=request.user,
            user=rated_user,
            defaults={
                "rating": rating_value,
                "name": review_text,
            },
        )

        response_serializer = self.get_serializer(rating)

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class UserRatingsView(generics.GenericAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        rated_user = get_object_or_404(User, pk=user_id)

        ratings = (
            Rating.objects
            .select_related("user", "reviewer")
            .filter(user=rated_user, reviewer__isnull=False)
            .order_by("-updated_at")
        )

        average = ratings.aggregate(avg=Avg("rating"))["avg"]
        my_rating = ratings.filter(reviewer=request.user).first()

        return Response({
            "average": round(average, 1) if average is not None else None,
            "count": ratings.count(),
            "can_rate": (
                rated_user != request.user
                and users_have_accepted_match(request.user, rated_user)
            ),
            "my_rating": RatingSerializer(my_rating).data if my_rating else None,
            "reviews": RatingSerializer(ratings, many=True).data,
        })