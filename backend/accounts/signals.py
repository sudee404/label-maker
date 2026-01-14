import logging
from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_migrate)
def create_demo_user(sender, **kwargs):
    """
    Create a demo/development superuser after migrations.
    """
    if sender.name != "accounts":
        return

    demo_email = "demo@shiphub.com"
    demo_password = "ChangeMe123!"

    user, created = User.objects.get_or_create(
        email=demo_email,
        defaults={
            "first_name": "John",
            "last_name": "Doe",
            "is_staff": True,
            "is_superuser": True,
            "is_active": True,
        },
    )

    if created:
        user.set_password(demo_password)
        user.save()
        logger.warning(
            "\n" + "=" * 60 + "\n"
            "          DEMO SUPERUSER CREATED SUCCESSFULLY          \n"
            + "="
            * 60
            + "\n"
            f"Email    : {demo_email}\n"
            f"Password : {demo_password}\n\n" + "=" * 60 + "\n"
        )
    else:
        logger.debug("Demo user already exists (%s) — no action taken", demo_email)
