from rest_framework import status
from rest_framework.test import APITestCase
from core.models import CustomUser
from ..models import Skill, SwapRequest

class SkillAndSwapRequestApiTests(APITestCase):
    def setUp(self):
        # Create users
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
        self.third_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            first_name="Other",
            last_name="User",
        )

        # Create specific skills
        self.my_skill = Skill.objects.create(
            user=self.sender,
            title="React Tutoring",
            description="Helping with React basics.",
            category="Programming",
        )
        self.available_skill = Skill.objects.create(
            user=self.receiver,
            title="Guitar Lessons",
            description="Beginner sessions.",
            category="Music",
        )

    def get_data_list(self, response_data):
        """Helper to handle both paginated and non-paginated responses"""
        if isinstance(response_data, dict) and 'results' in response_data:
            return response_data['results']
        return response_data

    def test_skills_endpoint_returns_available_skills_by_default(self):
        self.client.force_authenticate(user=self.sender)
        response = self.client.get("/api/skills/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Handle pagination or list
        results = self.get_data_list(response.data)
        skill_ids = [skill['id'] for skill in results]
        
        self.assertIn(self.available_skill.id, skill_ids)
        self.assertNotIn(self.my_skill.id, skill_ids)

    def test_skills_endpoint_returns_my_skills_when_requested(self):
        self.client.force_authenticate(user=self.sender)
        response = self.client.get("/api/skills/", {"mine": "true"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = self.get_data_list(response.data)
        skill_ids = [skill['id'] for skill in results]
        
        self.assertIn(self.my_skill.id, skill_ids)
        self.assertNotIn(self.available_skill.id, skill_ids)

    def test_swap_request_create_sets_sender_and_lists_related_requests(self):
        self.client.force_authenticate(user=self.sender)
        create_response = self.client.post(
            "/api/requests/",
            {
                "receiver": self.receiver.id,
                "skill": self.available_skill.id,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        
        swap_request = SwapRequest.objects.filter(sender=self.sender, skill=self.available_skill).first()
        self.assertIsNotNone(swap_request)

        # Test receiver can see it
        self.client.force_authenticate(user=self.receiver)
        receiver_list_response = self.client.get("/api/requests/")
        
        results = self.get_data_list(receiver_list_response.data)
        request_ids = [req['id'] for req in results]
        self.assertIn(swap_request.id, request_ids)

        # Test unrelated user cannot see it
        self.client.force_authenticate(user=self.third_user)
        unrelated_response = self.client.get("/api/requests/")
        
        results = self.get_data_list(unrelated_response.data)
        unrelated_request_ids = [req['id'] for req in results]
        self.assertNotIn(swap_request.id, unrelated_request_ids)

    def test_connections_endpoint_returns_only_accepted_other_users(self):
        accepted_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.available_skill,
            status=SwapRequest.STATUS_ACCEPTED,
        )
        SwapRequest.objects.create(
            sender=self.third_user,
            receiver=self.sender,
            skill=self.my_skill,
            status=SwapRequest.STATUS_PENDING,
        )

        self.client.force_authenticate(user=self.sender)
        response = self.client.get("/api/connections/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = self.get_data_list(response.data)
        connection_ids = [user["id"] for user in results]

        self.assertIn(self.receiver.id, connection_ids)
        self.assertNotIn(self.sender.id, connection_ids)
        self.assertNotIn(self.third_user.id, connection_ids)
        self.assertEqual(
            connection_ids.count(self.receiver.id),
            1,
            msg=f"Expected one connection for accepted request {accepted_request.id}",
        )

    def test_unrelated_user_gets_forbidden_on_swap_request_detail(self):
        swap_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.available_skill,
        )

        self.client.force_authenticate(user=self.third_user)
        response = self.client.get(f"/api/requests/{swap_request.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_only_receiver_can_accept_or_reject_request(self):
        swap_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.available_skill,
        )

        self.client.force_authenticate(user=self.sender)
        forbidden_response = self.client.patch(
            f"/api/requests/{swap_request.id}/",
            {"status": SwapRequest.STATUS_ACCEPTED},
            format="json",
        )
        self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.receiver)
        accepted_response = self.client.patch(
            f"/api/requests/{swap_request.id}/",
            {"status": SwapRequest.STATUS_ACCEPTED},
            format="json",
        )
        self.assertEqual(accepted_response.status_code, status.HTTP_200_OK)

        swap_request.refresh_from_db()
        self.assertEqual(swap_request.status, SwapRequest.STATUS_ACCEPTED)

    def test_only_sender_can_withdraw_or_delete_request(self):
        withdraw_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.available_skill,
        )
        delete_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=Skill.objects.create(
                user=self.receiver,
                title="Piano Lessons",
                description="Intro to chords.",
                category="Music",
            ),
        )

        self.client.force_authenticate(user=self.receiver)
        forbidden_withdraw_response = self.client.patch(
            f"/api/requests/{withdraw_request.id}/",
            {"status": SwapRequest.STATUS_WITHDRAWN},
            format="json",
        )
        self.assertEqual(
            forbidden_withdraw_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        forbidden_delete_response = self.client.delete(
            f"/api/requests/{delete_request.id}/"
        )
        self.assertEqual(
            forbidden_delete_response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.client.force_authenticate(user=self.sender)
        withdraw_response = self.client.patch(
            f"/api/requests/{withdraw_request.id}/",
            {"status": SwapRequest.STATUS_WITHDRAWN},
            format="json",
        )
        self.assertEqual(withdraw_response.status_code, status.HTTP_200_OK)

        withdraw_request.refresh_from_db()
        self.assertEqual(withdraw_request.status, SwapRequest.STATUS_WITHDRAWN)

        delete_response = self.client.delete(f"/api/requests/{delete_request.id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            SwapRequest.objects.filter(pk=delete_request.id).exists()
        )

    def test_self_swap_request_is_rejected_on_create(self):
        self.client.force_authenticate(user=self.sender)
        response = self.client.post(
            "/api/requests/",
            {
                "receiver": self.sender.id,
                "skill": self.my_skill.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("receiver", response.data)

    def test_non_pending_status_injection_is_rejected_on_create(self):
        self.client.force_authenticate(user=self.sender)
        response = self.client.post(
            "/api/requests/",
            {
                "receiver": self.receiver.id,
                "skill": self.available_skill.id,
                "status": SwapRequest.STATUS_ACCEPTED,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data)

    def test_accepted_request_cannot_move_back_to_pending(self):
        swap_request = SwapRequest.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            skill=self.available_skill,
            status=SwapRequest.STATUS_ACCEPTED,
        )

        self.client.force_authenticate(user=self.receiver)
        response = self.client.patch(
            f"/api/requests/{swap_request.id}/",
            {"status": SwapRequest.STATUS_PENDING},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        swap_request.refresh_from_db()
        self.assertEqual(swap_request.status, SwapRequest.STATUS_ACCEPTED)
