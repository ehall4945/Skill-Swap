from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Conversation, Message
from core.models import CustomUser
from notifications.models import Notification
from skills.models import Skill, SwapRequest


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.sender = CustomUser.objects.create_user(
            email="sender@example.com",
            password="password123",
            first_name="Sender",
            last_name="User",
        )
        self.receiver = CustomUser.objects.create_user(
            email="receiver@example.com",
            password="password123",
            first_name="Receiver",
            last_name="User",
        )
        self.skill = Skill.objects.create(
            user=self.receiver,
            title="Spanish Practice",
            description="Conversational tutoring.",
            category="Languages",
        )

    def test_creating_swap_request_creates_notification_for_receiver(self):
        self.client.force_authenticate(user=self.sender)
        response = self.client.post(
            "/api/requests/",
            {
                "receiver": self.receiver.id,
                "skill": self.skill.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        notification = Notification.objects.get(recipient=self.receiver)
        self.assertEqual(notification.actor, self.sender)
        self.assertEqual(notification.target_type, Notification.TARGET_REQUEST)

    def test_accepting_swap_request_creates_notification_for_sender(self):
        swap_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.skill,
        )
        Notification.objects.all().delete()

        self.client.force_authenticate(user=self.receiver)
        response = self.client.patch(
            f"/api/requests/{swap_request.id}/",
            {"status": SwapRequest.STATUS_ACCEPTED},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification = Notification.objects.get(recipient=self.sender)
        self.assertEqual(notification.actor, self.receiver)
        self.assertEqual(notification.target_id, swap_request.id)

    def test_creating_message_creates_notification_for_other_participant(self):
        conversation, _ = Conversation.get_or_create_between(self.sender, self.receiver)
        Message.objects.create(
            conversation=conversation,
            sender=self.sender,
            content="Hey, want to practice this week?",
        )

        notification = Notification.objects.get(recipient=self.receiver)
        self.assertEqual(notification.target_type, Notification.TARGET_MESSAGE)
        self.assertEqual(notification.target_id, conversation.id)

    def test_notifications_endpoint_returns_unread_count_and_limit(self):
        for index in range(25):
            Notification.objects.create(
                recipient=self.receiver,
                actor=self.sender,
                verb=f"Notification {index}",
                target_id=index + 1,
                target_type=Notification.TARGET_REQUEST,
            )

        self.client.force_authenticate(user=self.receiver)
        response = self.client.get("/api/notifications/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["unread_count"], 25)
        self.assertEqual(len(response.data["results"]), 20)

    def test_mark_read_endpoint_marks_notification_for_recipient(self):
        notification = Notification.objects.create(
            recipient=self.receiver,
            actor=self.sender,
            verb="sent you a new swap request",
            target_id=1,
            target_type=Notification.TARGET_REQUEST,
        )

        self.client.force_authenticate(user=self.receiver)
        response = self.client.patch(f"/api/notifications/{notification.id}/mark-read/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
