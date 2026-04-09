from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Skill, SwapRequest

User = get_user_model()

def get_display_name(user):
    full_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
    return full_name or user.email


class ConnectionSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return get_display_name(obj)

class SkillSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()

    def get_owner_name(self, obj):
        return get_display_name(obj.user)

    class Meta:
        model = Skill
        fields = [
            'id',
            'owner_name',
            'user',
            'title',
            'description',
            'category',
            'skill_type',
            'created_at'
        ]

        read_only_fields = ['user', 'owner_name', 'created_at']


class SwapRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    skill_title = serializers.ReadOnlyField(source="skill.title")

    class Meta:
        model = SwapRequest
        fields = [
            "id",
            "sender",
            "receiver",
            "skill",
            "status",
            "created_at",
            "sender_name",
            "skill_title",
        ]
        read_only_fields = [
            "sender",
            "created_at",
            "sender_name",
            "skill_title",
        ]

    def get_sender_name(self, obj):
        return get_display_name(obj.sender)

    def validate(self, attrs):
        request = self.context.get("request")
        sender = getattr(request, "user", None)
        receiver = attrs.get("receiver", self.instance.receiver if self.instance else None)
        skill = attrs.get("skill", self.instance.skill if self.instance else None)
        errors = {}

        # 1. Prevent self-swapping logic
        if sender and receiver and sender.id == receiver.id:
            if not self.instance:
                errors["receiver"] = "You cannot send a swap request to yourself."

        # 2. Ensure the skill actually belongs to the intended receiver
        if skill and receiver and skill.user_id != receiver.id:
            errors["receiver"] = "Receiver must own the selected skill."

        # 3. Check for existing pending requests to avoid duplicates
        if (
            sender
            and skill
            and SwapRequest.objects.filter(
                sender=sender,
                skill=skill,
                status=SwapRequest.STATUS_PENDING,
            ).exists()
        ):
            errors["skill"] = "You already have a pending request for this skill."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs
        