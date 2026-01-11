import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model for all Django models.
    Provides common fields like timestamps and soft delete functionality.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.__class__.__name__} ({self.pk})"

    def soft_delete(self):
        """Soft delete the instance by marking it as inactive."""
        self.is_active = False
        self.save(update_fields=["is_active", "updated_at"])

    def restore(self):
        """Restore a soft-deleted instance."""
        self.is_active = True
        self.save(update_fields=["is_active", "updated_at"])
