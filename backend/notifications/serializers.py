from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    actor_email = serializers.EmailField(source="actor.email", read_only=True)
    label = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "actor",
            "actor_name",
            "actor_email",
            "verb",
            "label",
            "target_id",
            "target_type",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        return obj.actor.get_full_name().strip() or obj.actor.email

    def get_label(self, obj):
        if obj.target_type == Notification.TARGET_MESSAGE:
            return "New Message"
        return "New Request"
