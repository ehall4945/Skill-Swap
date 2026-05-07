from rest_framework import serializers
from .models import Rating


def get_display_name(user):
    if not user:
        return "Community Member"

    full_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
    return full_name or user.email or "Community Member"


class RatingSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    rated_user_name = serializers.SerializerMethodField()

    # Public API calls this "review", even though the old DB column is "name".
    review = serializers.CharField(
        source="name",
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = Rating
        fields = [
            "id",
            "user",
            "reviewer",
            "reviewer_name",
            "rated_user_name",
            "rating",
            "review",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "reviewer",
            "reviewer_name",
            "rated_user_name",
            "created_at",
            "updated_at",
        ]

    def get_reviewer_name(self, obj):
        return get_display_name(obj.reviewer)

    def get_rated_user_name(self, obj):
        return get_display_name(obj.user)

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5 stars.")
        return value