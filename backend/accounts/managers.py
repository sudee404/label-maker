from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """
    Custom user model manager
    """

    def create_user(self, email: str, password: str = None, **extra_fields):
        """
        Create and save a user with the given email, full name, and password.
        """
        if not email:
            raise ValueError(_("The Email field must be set"))

        email = self.normalize_email(email).lower()
        extra_fields.setdefault("is_active", True)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str = None, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        if not email:
            raise ValueError(_("Superuser must have an email."))
        if not password:
            raise ValueError(_("Superuser must have a password."))

        email = self.normalize_email(email).lower()

        extra_fields.update(
            {
                "is_staff": True,
                "is_superuser": True,
            }
        )

        return self.create_user(email, password, **extra_fields)
