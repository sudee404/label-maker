from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _

from accounts.managers import CustomUserManager
from common.models.base_model import BaseModel


class CustomUser(AbstractUser, BaseModel):
    """Model definition for CustomUser."""

    username = None

    email = models.EmailField(unique=True, verbose_name=_("Email"))

    avatar = models.ImageField(
        upload_to="avatars/",
        null=True,
        blank=True,
        verbose_name=_("User Avatar"),
    )

    objects = CustomUserManager()

    # Required fields
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.get_full_name()}"

    @property
    def avatar_url(self):
        """Return the URL of the user's avatar or None."""
        if self.avatar:
            return self.avatar.url
        return None

    def is_verified(self):
        """Return True if the user is verified."""
        return (
            self.borrowerprofile.kyc_profile.is_verified
            if hasattr(self, "borrowerprofile")
            else False
        )

    class Meta:
        """Meta definition for Custom User."""

        verbose_name = "Custom User"
        verbose_name_plural = "Custom Users"

    def __str__(self):
        """Unicode representation of Custom User."""
        return f"{self.full_name or self.email}"
