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
        