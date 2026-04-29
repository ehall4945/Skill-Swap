from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import Conversation, Message
from core.models import CustomUser
from skills.models import Skill, SwapRequest


class DeleteAccountApiTests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="deleteme@example.com",
            password="password123",
            first_name="Delete",
            last_name="Me",
        )
        self.other_user = CustomUser.objects.create_user(
            email="partner@example.com",
            password="password123",
            first_name="Chat",
            last_name="Partner",
        )

        self.user_skill = Skill.objects.create(
            user=self.user,
            title="Python Mentoring",
            description="One-on-one Python help.",
            category="Programming",
        )
        self.other_skill = Skill.objects.create(
            user=self.other_user,
            title="Spanish Conversation",
            description="Practice your speaking skills.",
            category="Languages",
        )
        self.swap_request = SwapRequest.objects.create(
            sender=self.user,
            receiver=self.other_user,
            skill=self.other_skill,
            status=SwapRequest.STATUS_ACCEPTED,
        )

        self.conversation, _ = Conversation.get_or_create_between(self.user, self.other_user)
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user,
            content="Please keep this chat history.",
        )

    def test_delete_account_removes_user_owned_records_and_preserves_messages(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.delete("/api/profiles/delete-account/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CustomUser.objects.filter(pk=self.user.pk).exists())
        self.assertFalse(Skill.objects.filter(pk=self.user_skill.pk).exists())
        self.assertFalse(SwapRequest.objects.filter(pk=self.swap_request.pk).exists())

        self.message.refresh_from_db()
        self.assertIsNone(self.message.sender)
        self.assertTrue(
            Conversation.objects.filter(pk=self.conversation.pk).exists()
        )

        self.client.force_authenticate(user=self.other_user)
        messages_response = self.client.get(
            f"/api/chat/conversations/{self.conversation.pk}/messages/"
        )

        self.assertEqual(messages_response.status_code, status.HTTP_200_OK)
        message_payload = messages_response.data["results"][0]
        self.assertEqual(message_payload["content"], self.message.content)
        self.assertIsNone(message_payload["sender"])
