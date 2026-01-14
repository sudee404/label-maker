from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")
        self.login_url = reverse("login")
        self.logout_url = reverse("logout")
        self.refresh_url = reverse("token_refresh")

        # Test user data
        self.user_data = {
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "first_name": "Test",
            "last_name": "User",
        }

        self.login_data = {
            "email": "testuser@example.com",
            "password": "TestPass123!",
        }


    def test_registration_with_existing_email(self):
        """Test registration fails with duplicate email"""
        # First user
        User.objects.create_user(
            email="testuser@example.com",
            password="TestPass123!"
        )

        response = self.client.post(self.register_url, self.user_data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_registration_password_mismatch(self):
        """Test registration fails when passwords don't match"""
        data = self.user_data.copy()
        data["password2"] = "DifferentPass456!"
        
        response = self.client.post(self.register_url, data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        """Test successful login with correct credentials"""
        # Create user first
        User.objects.create_user(
            email=self.login_data["email"],
            password=self.login_data["password"]
        )

        response = self.client.post(self.login_url, self.login_data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("refresh", response.data)
        self.assertIn("access", response.data)
        self.assertIn("user", response.data)

    def test_login_with_wrong_password(self):
        """Test login fails with incorrect password"""
        User.objects.create_user(
            email="testuser@example.com",
            password="CorrectPass123!"
        )

        wrong_data = {
            "email": "testuser@example.com",
            "password": "WrongPass!"
        }

        response = self.client.post(self.login_url, wrong_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "Invalid credentials")

    def test_login_with_nonexistent_email(self):
        """Test login fails with non-existent email"""
        response = self.client.post(self.login_url, self.login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("Invalid credentials", str(response.data))

    def test_logout_success(self):
        """Test successful logout with valid refresh token"""
        # Create and login user
        user = User.objects.create_user(
            email="logout@test.com",
            password="LogoutPass123!"
        )
        refresh = RefreshToken.for_user(user)
        
        data = {"refresh": str(refresh)}
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")

        response = self.client.post(self.logout_url, data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)
        self.assertEqual(response.data["message"], "Successfully logged out")

        # Try to use the same refresh token again → should fail
        response2 = self.client.post(self.logout_url, data, format="json")
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_logout_without_token(self):
        """Test logout fails without refresh token"""
        response = self.client.post(self.logout_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_token_refresh_success(self):
        """Test refreshing access token with valid refresh token"""
        user = User.objects.create_user(
            email="refresh@test.com",
            password="RefreshPass123!"
        )
        refresh = RefreshToken.for_user(user)
        
        data = {"refresh": str(refresh)}
        
        response = self.client.post(self.refresh_url, data, format="json")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotEqual(str(refresh.access_token), response.data["access"])

    def test_token_refresh_with_invalid_token(self):
        """Test refresh fails with invalid/expired/blacklisted token"""
        data = {"refresh": "invalid.token.string"}
        
        response = self.client.post(self.refresh_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
