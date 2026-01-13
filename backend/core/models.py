from django.db import models
from django.contrib.auth import get_user_model

from common.models.base_model import BaseModel


User = get_user_model()


class Address(BaseModel):
    """Model definition for Address."""

    name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=2)
    zip_code = models.CharField(max_length=10)
    phone = models.CharField(max_length=20, blank=True)
    saved = models.BooleanField(default=False)

    class Meta:
        """Meta definition for Address."""

        verbose_name = "Saved Address"
        verbose_name_plural = "Saved Addresss"
        ordering = ["name"]

    def __str__(self):
        """Unicode representation of Address."""
        return f"{self.name} ({self.city}, {self.state})"


class Package(BaseModel):
    """Model definition for Package."""

    name = models.CharField(max_length=100)
    length_inches = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    width_inches = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    height_inches = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    weight_lbs = models.IntegerField(default=0)
    weight_oz = models.IntegerField(default=0)
    sku = models.CharField(max_length=50, blank=True)
    saved = models.BooleanField(default=False)

    class Meta:
        """Meta definition for Package."""

        verbose_name = "Package"
        verbose_name_plural = "Packages"
        ordering = ["name"]

    def __str__(self):
        """Unicode representation of Package."""
        return f"{self.name} ({self.weight_lbs}lb {self.weight_oz}oz)"


class Batch(BaseModel):
    """Model definition for Batch."""

    STATUS_CHOICES = [
        ("uploaded", "Uploaded"),
        ("reviewed", "Reviewed"),
        ("shipping_selected", "Shipping Selected"),
        ("purchased", "Purchased"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="uploaded")
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    label_format = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        """Meta definition for Batch."""

        verbose_name = "Batch"
        verbose_name_plural = "Batchs"
        ordering = ["-created_at"]

    def __str__(self):
        """Unicode representation of Batch."""
        return f"Batch {self.id} ({self.status})"

    def calculate_total(self):
        total = sum(shipment.price for shipment in self.shipments.all())
        self.total_price = total
        self.save(update_fields=["total_price", "updated_at"])


class Shipment(BaseModel):
    """Model definition for Shipment."""

    SERVICE_CHOICES = [
        ("priority", "Priority Mail"),
        ("ground", "Ground Shipping"),
    ]

    STATUS_CHOICES = [
        ("valid", "Valid"),
        ("incomplete", "Incomplete"),
        ("error", "Error"),
    ]
    order_no = models.CharField(max_length=50, blank=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name="shipments")
    # Ship From
    ship_from = models.ForeignKey(
        Address,
        related_name="ship_from_addresses",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    # Ship To
    ship_to = models.ForeignKey(
        Address,
        related_name="ship_to_addresses",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    # Package
    package = models.ForeignKey(
        Package,
        related_name="shipments",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="valid")
    shipping_service = models.CharField(
        max_length=20, choices=SERVICE_CHOICES, null=True, blank=True
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        """Meta definition for Shipment."""

        verbose_name = "Shipment"
        verbose_name_plural = "Shipments"
        ordering = ["-created_at"]

    def __str__(self):
        """Unicode representation of Shipment."""
        return f"Order {self.order_no or self.id}"

    def save(self, *args, **kwargs):
        if self.shipping_service:
            base = 5.00 if self.shipping_service == "priority" else 2.50
            per_oz = 0.10 if self.shipping_service == "priority" else 0.05
            total_oz = (self.weight_lbs * 16) + self.weight_oz
            self.price = base + (per_oz * total_oz)
        super().save(*args, **kwargs)
