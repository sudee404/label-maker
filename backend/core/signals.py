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
    
    print('here')
    """
    Signal handler to validate shipment and calculate price before saving.
    
    This runs before every save operation, ensuring fresh validation
    based on the current state of related objects.
    """
    shipment = instance
    shipment_id = shipment.order_no or f"ID:{shipment.id if shipment.id else 'new'}"
    
    logger.debug(f"Running pre_save validation for Shipment {shipment_id}")
    
    # Reset error message and price
    shipment.error_message = ""
    shipment.price = Decimal("0.00")
    errors = []

    # Step 1: Refresh related objects to ensure we have the latest data
    # This is critical when objects are updated in the same request
    try:
        if shipment.ship_from_id:
            shipment.ship_from = Address.objects.get(pk=shipment.ship_from_id)
            logger.debug(f"Refreshed ship_from: {shipment.ship_from}")
        if shipment.ship_to_id:
            shipment.ship_to = Address.objects.get(pk=shipment.ship_to_id)
            logger.debug(f"Refreshed ship_to: {shipment.ship_to}")
        if shipment.package_id:
            shipment.package = Package.objects.get(pk=shipment.package_id)
            logger.debug(f"Refreshed package: {shipment.package}")
    except (Address.DoesNotExist, Package.DoesNotExist) as e:
        logger.error(f"Error refreshing related objects for Shipment {shipment_id}: {str(e)}")

    # Step 2: Check for missing required relationships (incomplete status)
    missing_parts = []
    if not shipment.ship_from_id or not shipment.ship_from:
        missing_parts.append("sender address")
    if not shipment.ship_to_id or not shipment.ship_to:
        missing_parts.append("recipient address")
    if not shipment.package_id or not shipment.package:
        missing_parts.append("package")

    if missing_parts:
        shipment.status = "incomplete"
        shipment.error_message = f"Missing required information: {', '.join(missing_parts)}"
        
        logger.info(
            f"Shipment {shipment_id} marked as incomplete: {shipment.error_message}"
        )
        return

    # Step 3: All required parts exist, now validate them (error status if invalid)
    
    # Validate ship_from address
    is_valid, error_msg = shipment.validate_address(shipment.ship_from, "sender")
    if not is_valid:
        errors.append(error_msg)

    # Validate ship_to address
    is_valid, error_msg = shipment.validate_address(shipment.ship_to, "recipient")
    if not is_valid:
        errors.append(error_msg)

    # Validate package
    is_valid, error_msg = shipment.validate_package()
    if not is_valid:
        errors.append(error_msg)

    # Step 4: Set final status and price
    if errors:
        shipment.status = "error"
        shipment.error_message = " | ".join(errors)
        shipment.price = Decimal("0.00")
        
        logger.warning(
            f"Shipment {shipment_id} has validation errors: {shipment.error_message}"
        )
    else:
        shipment.status = "valid"
        shipment.price = shipment.calculate_price()
        
        logger.info(
            f"Shipment {shipment_id} validated successfully. "
            f"Service: {shipment.shipping_service}, Price: ${shipment.price}"
        )

    # Log comprehensive shipment details
    logger.debug(
        f"Pre-save validation complete for Shipment {shipment_id} - "
        f"Status: {shipment.status}, "
        f"Service: {shipment.shipping_service}, "
        f"Price: ${shipment.price}, "
        f"Ship From ID: {shipment.ship_from_id}, "
        f"Ship To ID: {shipment.ship_to_id}, "
        f"Package ID: {shipment.package_id}, "
        f"Errors: {shipment.error_message if shipment.error_message else 'None'}"
    )