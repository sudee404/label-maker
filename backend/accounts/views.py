import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from .serializers import (
    BasicUserSerializer,
    LogoutSerializer,
    RegisterSerializer,
    LoginSerializer,
)
from rest_framework_simplejwt.views import TokenRefreshView as SimpleJWTTokenRefreshView

User = get_user_model()

# Get logger for this module
logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            logger.info(
                "New user registered successfully - email: %s, id: %s",
                user.email,
                user.id,
            )

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": BasicUserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            logger.error("Registration failed: %s ", str(e))
            return Response(
                {"message": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning("Login attempt failed - user not found: %s", email)
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if user.check_password(password):
                refresh = RefreshToken.for_user(user)

                logger.info(
                    "User logged in successfully - email: %s, id: %s",
                    user.email,
                    user.id,
                )

                return Response(
                    {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                        "user": BasicUserSerializer(user).data,
                    }
                )

            else:
                logger.warning("Login failed - wrong password for email: %s", email)
                return Response(
                    {"error": "Invalid credentials"},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        except Exception as e:
            logger.error("Unexpected error during login: %s", str(e), exc_info=True)
            return Response(
                {"error": "Something went wrong"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutView(generics.GenericAPIView):
    """
    Logout view to blacklist refresh token.
    """

    serializer_class = LogoutSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            refresh_token = serializer.validated_data["refresh"]

            if not refresh_token:
                logger.warning(
                    "Logout attempt without refresh token - user: %s", request.user
                )
                return Response(
                    {"error": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            logger.info("User logged out successfully - user: %s", request.user)

            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_205_RESET_CONTENT,
            )

        except TokenError as e:
            logger.warning("Invalid refresh token during logout - %s", str(e))
            return Response(
                {"error": f"Invalid token: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.error("Logout error: %s", str(e), exc_info=True)
            return Response(
                {"error": "Logout failed"}, status=status.HTTP_400_BAD_REQUEST
            )


class TokenRefreshView(SimpleJWTTokenRefreshView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get("access")
            if access_token:
                try:
                    token = AccessToken(access_token)
                    user_id = token["user_id"]
                    user = User.objects.get(id=user_id)

                    response.data["user"] = BasicUserSerializer(user).data

                    logger.debug(
                        "Token refreshed successfully for user: %s", user.email
                    )

                except User.DoesNotExist:
                    logger.warning("Token refresh - user not found for id: %s", user_id)
                except Exception as e:
                    logger.warning(
                        "Failed to add user data to refresh response: %s", str(e)
                    )

        else:
            logger.warning("Token refresh failed - status: %s", response.status_code)

        return response
