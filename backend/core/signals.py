import logging
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.db.models.signals import pre_save
from django.dispatch import receiver

from core.models import Address, Package, Shipment


User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Shipment)
def validate_and_price_shipment(sender, instance, **kwargs):
    """
    Signal handler that validates shipment data and calculates price before saving.
    Produces detailed, user-friendly error messages.
    """
    shipment = instance
    shipment_id = shipment.order_no or f"ID:{shipment.id if shipment.id else 'new'}"
    
    logger.debug(f"Running pre_save validation for Shipment {shipment_id}")
    
    # Reset
    shipment.error_message = ""
    shipment.price = Decimal("0.00")
    errors = []

    # ── 1. Refresh related objects (critical in bulk/tight loops) ──────────────
    try:
        if shipment.ship_from_id:
            shipment.ship_from = Address.objects.get(pk=shipment.ship_from_id)
        if shipment.ship_to_id:
            shipment.ship_to = Address.objects.get(pk=shipment.ship_to_id)
        if shipment.package_id:
            shipment.package = Package.objects.get(pk=shipment.package_id)
    except (Address.DoesNotExist, Package.DoesNotExist) as e:
        logger.error(f"Critical: Related object missing for Shipment {shipment_id}: {e}")
        errors.append("System error: Related address or package record could not be found")

    # ── 2. Missing required relationships ──────────────────────────────────────
    missing_parts = []
    if not shipment.ship_from:
        missing_parts.append("Sender (ship-from) address is missing")
    if not shipment.ship_to:
        missing_parts.append("Recipient (ship-to) address is missing")
    if not shipment.package:
        missing_parts.append("Package information is missing")

    if missing_parts:
        shipment.status = "incomplete"
        shipment.error_message = "Incomplete shipment: " + "; ".join(missing_parts) + "."
        logger.info(f"Shipment {shipment_id} incomplete: {shipment.error_message}")
        return

    # ── 3. Detailed field-level validation ─────────────────────────────────────
    # Sender address validation
    is_valid_from, msg_from = shipment.validate_address(shipment.ship_from, "sender")
    if not is_valid_from:
        errors.append(f"Sender address: {msg_from}")

    # Recipient address validation
    is_valid_to, msg_to = shipment.validate_address(shipment.ship_to, "recipient")
    if not is_valid_to:
        errors.append(f"Recipient address: {msg_to}")

    # Package validation
    is_valid_pkg, msg_pkg = shipment.validate_package()
    if not is_valid_pkg:
        errors.append(f"Package: {msg_pkg}")

    # ── 4. Final decision ──────────────────────────────────────────────────────
    if errors:
        shipment.status = "error"
        # Join with newlines + numbering for better readability in logs & API
        shipment.error_message = "Validation failed:\n" + "\n".join(
            f"{i+1}. {err}" for i, err in enumerate(errors)
        )
        
        logger.warning(
            "Shipment %s validation failed:\n%s",
            shipment_id,
            shipment.error_message
        )
    else:
        shipment.status = "valid"
        try:
            shipment.price = shipment.calculate_price()
            logger.info(
                "Shipment %s validated OK | Service: %s | Price: $%s",
                shipment_id,
                shipment.shipping_service,
                shipment.price
            )
        except Exception as exc:
            shipment.status = "error"
            shipment.error_message = f"Price calculation failed: {str(exc)}"
            logger.error("Price calculation error for %s: %s", shipment_id, exc, exc_info=True)

    # ── Final detailed log (very useful during debugging) ──────────────────────
    logger.debug(
        "Validation result for Shipment %s:\n"
        "  Status: %s\n"
        "  Price: $%s\n"
        "  Service: %s\n"
        "  Ship From: %s\n"
        "  Ship To: %s\n"
        "  Package: %s\n"
        "  Errors: %s",
        shipment_id,
        shipment.status,
        shipment.price,
        shipment.shipping_service,
        shipment.ship_from_id,
        shipment.ship_to_id,
        shipment.package_id,
        shipment.error_message or "None"
    )
    
    