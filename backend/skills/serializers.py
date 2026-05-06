from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Skill, SwapRequest

User = get_user_model()

def get_display_name(user):
    full_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
    return full_name or user.email


def get_user_profile(user):
    try:
        return user.profile
    except ObjectDoesNotExist:
        return None


class ConnectionSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "full_name"]

    def get_full_name(self, obj):
        return get_display_name(obj)

class SkillSerializer(serializers.ModelSerializer):
    owner_name = serializers.SerializerMethodField()
    owner_first_name = serializers.ReadOnlyField(source="user.first_name")
    owner_last_name = serializers.ReadOnlyField(source="user.last_name")
    owner_headline = serializers.SerializerMethodField()
    owner_location = serializers.SerializerMethodField()
    owner_location_display = serializers.SerializerMethodField()
    owner_skills_wanted = serializers.SerializerMethodField()
    owner_profile_image = serializers.SerializerMethodField()

    def get_owner_name(self, obj):
        return get_display_name(obj.user)

    def get_owner_headline(self, obj):
        profile = get_user_profile(obj.user)
        return profile.headline if profile else ""

    def get_owner_location(self, obj):
        profile = get_user_profile(obj.user)
        return profile.location if profile else ""

    def get_owner_location_display(self, obj):
        profile = get_user_profile(obj.user)
        return profile.get_location_display() if profile and profile.location else ""

    def get_owner_skills_wanted(self, obj):
        profile = get_user_profile(obj.user)
        return profile.skills_wanted if profile else ""

    def get_owner_profile_image(self, obj):
        profile = get_user_profile(obj.user)
        if not profile or not profile.profile_image:
            return ""

        image_url = profile.profile_image.url
        request = self.context.get("request")
        return request.build_absolute_uri(image_url) if request else image_url

    class Meta:
        model = Skill
        fields = [
            'id',
            'owner_name',
            'owner_first_name',
            'owner_last_name',
            'owner_headline',
            'owner_location',
            'owner_location_display',
            'owner_skills_wanted',
            'owner_profile_image',
            'user',
            'title',
            'description',
            'category',
            'skill_type',
            'created_at'
        ]

        read_only_fields = [
            'user',
            'owner_name',
            'owner_first_name',
            'owner_last_name',
            'owner_headline',
            'owner_location',
            'owner_location_display',
            'owner_skills_wanted',
            'owner_profile_image',
            'created_at',
        ]


class SwapRequestSerializer(serializers.ModelSerializer):
    sender_id = serializers.ReadOnlyField(source="sender.id")
    receiver_id = serializers.ReadOnlyField(source="receiver.id")
    sender_name = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    skill_title = serializers.ReadOnlyField(source="skill.title")
    skill_category = serializers.ReadOnlyField(source="skill.category")

    class Meta:
        model = SwapRequest
        fields = [
            "id",
            "sender",
            "sender_id",
            "receiver",
            "receiver_id",
            "skill",
            "status",
            "created_at",
            "sender_name",
            "receiver_name",
            "skill_title",
            "skill_category",
        ]
        read_only_fields = [
            "sender",
            "sender_id",
            "receiver_id",
            "created_at",
            "sender_name",
            "receiver_name",
            "skill_title",
            "skill_category",
        ]

    def get_sender_name(self, obj):
        return get_display_name(obj.sender)

    def get_receiver_name(self, obj):
        return get_display_name(obj.receiver)

    def validate(self, attrs):
        request = self.context.get("request")
        sender = getattr(request, "user", None)
        receiver = attrs.get("receiver", self.instance.receiver if self.instance else None)
        skill = attrs.get("skill", self.instance.skill if self.instance else None)
        status_value = attrs.get("status")
        errors = {}

        if self.instance:
            immutable_fields = {"sender", "receiver", "skill"} & set(self.initial_data.keys())
            if immutable_fields:
                errors["detail"] = "Only the request status can be updated after creation."

            if (
                status_value in {
                    SwapRequest.STATUS_ACCEPTED,
                    SwapRequest.STATUS_REJECTED,
                }
                and sender
                and sender.id != self.instance.receiver_id
            ):
                errors["status"] = "Only the receiver can accept or reject this request."

            if (
                status_value == SwapRequest.STATUS_WITHDRAWN
                and sender
                and sender.id != self.instance.sender_id
            ):
                errors["status"] = "Only the sender can withdraw this request."
        else:
            # 1. Prevent self-swapping logic
            if sender and receiver and sender.id == receiver.id:
                errors["receiver"] = "You cannot send a swap request to yourself."

            # 2. Ensure the skill actually belongs to the intended receiver
            if skill and receiver and skill.user_id != receiver.id:
                errors["receiver"] = "Receiver must own the selected skill."

            # 3. New requests must always start pending
            if (
                status_value is not None
                and status_value != SwapRequest.STATUS_PENDING
            ):
                errors["status"] = "New swap requests must start in pending status."

            # 4. Check for existing pending requests to avoid duplicates
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
        
