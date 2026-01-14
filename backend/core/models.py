import logging
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model

from common.models.base_model import BaseModel


User = get_user_model()
logger = logging.getLogger(__name__)


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
        verbose_name_plural = "Saved Addresses"
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
        verbose_name_plural = "Batches"
        ordering = ["-created_at"]

    def __str__(self):
        """Unicode representation of Batch."""
        return f"Batch {self.id} ({self.status})"

    def calculate_total(self):
        """Calculate total price from all shipments in batch."""
        try:
            shipments = self.shipments.all()
            total = sum(
                shipment.price for shipment in shipments if shipment.price is not None
            )
            self.total_price = Decimal(str(total))
            self.save(update_fields=["total_price", "updated_at"])

            logger.info(
                f"Calculated total for Batch {self.id}: "
                f"${self.total_price} from {shipments.count()} shipments"
            )
        except Exception as e:
            logger.error(
                f"Error calculating total for Batch {self.id}: {str(e)}", exc_info=True
            )
            raise


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
        max_length=20, choices=SERVICE_CHOICES, default="ground"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    error_message = models.TextField(blank=True)

    class Meta:
        """Meta definition for Shipment."""

        verbose_name = "Shipment"
        verbose_name_plural = "Shipments"
        ordering = ["-created_at"]

    def __str__(self):
        """Unicode representation of Shipment."""
        return f"Order {self.order_no or self.id}"

    def validate_address(self, address, address_type="address"):
        """
        Validate an address object.

        Args:
            address: Address object to validate
            address_type: Type of address for error messaging ('sender' or 'recipient')

        Returns:
            tuple: (is_valid, error_message)
        """
        if not address:
            error = f"Missing {address_type} address"
            logger.debug(f"Address validation failed: {error}")
            return False, error

        # Check required fields
        required_fields = {
            "first_name": (address.first_name, "first name"),
            "last_name": (address.last_name, "last name"),
            "address_line1": (address.address_line1, "address line 1"),
            "city": (address.city, "city"),
            "state": (address.state, "state"),
            "zip_code": (address.zip_code, "zip code"),
        }

        missing_fields = []
        for field_name, (value, display_name) in required_fields.items():
            if not value or (isinstance(value, str) and not value.strip()):
                missing_fields.append(display_name)

        if missing_fields:
            error = f"{address_type.capitalize()} address missing: {', '.join(missing_fields)}"
            logger.debug(f"Address validation failed: {error}")
            return False, error

        # Validate state code length
        state_clean = address.state.strip()
        if len(state_clean) != 2:
            error = f"{address_type.capitalize()} address has invalid state code: '{address.state}' (must be 2 characters)"
            logger.debug(f"Address validation failed: {error}")
            return False, error

        # Validate zip code length
        zip_clean = address.zip_code.strip()
        if not (5 <= len(zip_clean) <= 10):
            error = f"{address_type.capitalize()} address has invalid zip code: '{address.zip_code}' (must be 5-10 characters)"
            logger.debug(f"Address validation failed: {error}")
            return False, error

        logger.debug(f"{address_type.capitalize()} address validated successfully")
        return True, ""

    def validate_package(self):
        """
        Validate package dimensions and weight.

        Returns:
            tuple: (is_valid, error_message)
        """
        if not self.package:
            error = "Missing package information"
            logger.debug(f"Package validation failed: {error}")
            return False, error

        package = self.package
        errors = []

        # Check dimensions are positive
        try:
            length = Decimal(str(package.length_inches))
            width = Decimal(str(package.width_inches))
            height = Decimal(str(package.height_inches))

            if length <= 0:
                errors.append("length must be greater than 0")
            if width <= 0:
                errors.append("width must be greater than 0")
            if height <= 0:
                errors.append("height must be greater than 0")

            if errors:
                error = f"Package has invalid dimensions: {', '.join(errors)}"
                logger.debug(f"Package validation failed: {error}")
                return False, error

        except (ValueError, TypeError, Exception) as e:
            error = f"Package has invalid dimension values: {str(e)}"
            logger.warning(f"Package dimension conversion error: {error}")
            return False, error

        # Check weight is not negative
        if package.weight_lbs < 0:
            error = "Package weight (lbs) cannot be negative"
            logger.debug(f"Package validation failed: {error}")
            return False, error

        if package.weight_oz < 0:
            error = "Package weight (oz) cannot be negative"
            logger.debug(f"Package validation failed: {error}")
            return False, error

        # Check weight is not zero
        if package.weight_lbs == 0 and package.weight_oz == 0:
            error = "Package weight must be greater than 0"
            logger.debug(f"Package validation failed: {error}")
            return False, error

        # Check ounces are valid (should be 0-15)
        if package.weight_oz >= 16:
            error = (
                f"Package weight ounces must be less than 16 (got {package.weight_oz})"
            )
            logger.debug(f"Package validation failed: {error}")
            return False, error

        logger.debug("Package validated successfully")
        return True, ""

    def calculate_price(self):
        """Calculate shipping price based on service and weight."""
        if not self.shipping_service:
            logger.warning("Cannot calculate price: no shipping service selected")
            return Decimal("0.00")

        if not self.package:
            logger.warning("Cannot calculate price: no package assigned")
            return Decimal("0.00")

        # Set base rates and per-ounce rates
        if self.shipping_service == "priority":
            base = Decimal("5.00")
            per_oz = Decimal("0.10")
        else:  # ground
            base = Decimal("2.50")
            per_oz = Decimal("0.05")

        # Calculate total ounces
        total_oz = (self.package.weight_lbs * 16) + self.package.weight_oz
        price = base + (per_oz * Decimal(str(total_oz)))

        # Round to 2 decimal places
        price = price.quantize(Decimal("0.01"))

        logger.debug(
            f"Calculated price for shipment {self.order_no or 'new'}: ${price} "
            f"(service: {self.shipping_service}, weight: {total_oz}oz)"
        )

        return price

    def save(self, *args, **kwargs):
        return super().save(*args, **kwargs)
