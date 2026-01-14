import logging
from io import BytesIO
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import black, HexColor
from reportlab.graphics.barcode import code128

# Configure logging (you can move this to your project's main settings)
logger = logging.getLogger(__name__)

# Label dimensions
LABEL_4X6_WIDTH = 4 * inch
LABEL_4X6_HEIGHT = 6 * inch
LETTER_WIDTH, LETTER_HEIGHT = letter

# Professional color scheme
BORDER_COLOR = HexColor("#2c3e50")
HEADER_BG = HexColor("#ecf0f1")
ACCENT_COLOR = HexColor("#3498db")
TEXT_PRIMARY = black
TEXT_SECONDARY = HexColor("#7f8c8d")


def generate_shipping_labels_pdf(shipments, label_format="4x6"):
    """
    Generate multi-page PDF with labels in specified format.

    Args:
        shipments: List of shipment objects
        label_format: "4x6" for thermal labels or "letter" for Letter/A4 paper

    Returns:
        BytesIO buffer ready to be sent as HttpResponse
    """
    if not shipments:
        logger.warning("generate_shipping_labels_pdf called with empty shipments list")
        buffer = BytesIO()
        buffer.seek(0)
        return buffer

    logger.info(
        "Starting PDF generation for %d shipments (format: %s)",
        len(shipments),
        label_format,
    )

    buffer = BytesIO()

    # Normalize label format
    label_format = (label_format or "4x6").lower()
    is_letter = label_format in ["letter", "a4", "letter/a4"]

    try:
        if is_letter:
            logger.debug("Using Letter/A4 format - 2 labels per page")
            c = canvas.Canvas(buffer, pagesize=(LETTER_WIDTH, LETTER_HEIGHT))

            for i, shipment in enumerate(shipments):
                page_position = i % 2

                if i > 0 and page_position == 0:
                    logger.debug("Showing new page for letter format")
                    c.showPage()

                _draw_letter_label(c, shipment, page_position)

            c.save()
        else:
            logger.debug("Using 4x6 thermal label format - 1 label per page")
            c = canvas.Canvas(buffer, pagesize=(LABEL_4X6_WIDTH, LABEL_4X6_HEIGHT))

            for i, shipment in enumerate(shipments, 1):
                if i > 1:
                    logger.debug("Showing new page for 4x6 label #%d", i)
                    c.showPage()

                _draw_single_4x6_label(c, shipment)

            c.save()

        logger.info(
            "PDF generation completed successfully for %d shipments", len(shipments)
        )

    except Exception:
        logger.error("Failed to generate shipping labels PDF", exc_info=True)
        raise

    buffer.seek(0)
    return buffer


def _draw_single_4x6_label(c, shipment):
    """Professional 4x6 shipping label with spacious layout and real barcode."""
    logger.debug(
        "Drawing 4x6 label for shipment: %s", getattr(shipment, "order_no", shipment.id)
    )

    margin = 0.3 * inch
    content_width = LABEL_4X6_WIDTH - (2 * margin)

    # Draw outer border
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(1.5)
    c.rect(margin / 2, margin / 2, LABEL_4X6_WIDTH - margin, LABEL_4X6_HEIGHT - margin)

    y_position = LABEL_4X6_HEIGHT - margin - 0.15 * inch

    # Header - Service & Price
    header_height = 0.5 * inch
    c.setFillColor(HEADER_BG)
    c.rect(
        margin,
        y_position - header_height + 0.15 * inch,
        content_width,
        header_height,
        fill=1,
        stroke=0,
    )

    service_display = (
        shipment.get_shipping_service_display()
        if hasattr(shipment, "get_shipping_service_display")
        else "Standard Shipping"
    )
    price_text = (
        f"${shipment.price:.2f}"
        if hasattr(shipment, "price") and shipment.price is not None
        else "$0.00"
    )

    c.setFillColor(ACCENT_COLOR)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin + 0.1 * inch, y_position - 0.12 * inch, service_display)

    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(
        LABEL_4X6_WIDTH - margin - 0.1 * inch, y_position - 0.12 * inch, price_text
    )

    y_position -= header_height + 0.25 * inch

    # FROM section
    c.setFillColor(TEXT_SECONDARY)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(margin + 0.1 * inch, y_position, "SHIP FROM:")
    y_position -= 0.2 * inch

    if hasattr(shipment, "ship_from") and shipment.ship_from:
        y_position = _draw_address_block(
            c,
            shipment.ship_from,
            margin + 0.1 * inch,
            y_position,
            LABEL_4X6_WIDTH,
            margin,
            is_from=True,
        )
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(margin + 0.1 * inch, y_position, "No sender address provided")
        y_position -= 0.18 * inch

    # Separator
    y_position -= 0.15 * inch
    c.setStrokeColor(HexColor("#dfe6e9"))
    c.setLineWidth(1)
    c.line(
        margin + 0.1 * inch,
        y_position,
        LABEL_4X6_WIDTH - margin - 0.1 * inch,
        y_position,
    )

    y_position -= 0.25 * inch

    # TO section
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin + 0.1 * inch, y_position, "DELIVER TO:")
    y_position -= 0.25 * inch

    if hasattr(shipment, "ship_to") and shipment.ship_to:
        y_position = _draw_address_block(
            c,
            shipment.ship_to,
            margin + 0.1 * inch,
            y_position,
            LABEL_4X6_WIDTH,
            margin,
            is_from=False,
        )
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(margin + 0.1 * inch, y_position, "No recipient address provided")
        y_position -= 0.22 * inch

    # Package details
    details_y = 1.9 * inch
    c.setStrokeColor(HexColor("#dfe6e9"))
    c.setLineWidth(1)
    c.line(
        margin + 0.1 * inch,
        details_y + 0.5 * inch,
        LABEL_4X6_WIDTH - margin - 0.1 * inch,
        details_y + 0.5 * inch,
    )

    if hasattr(shipment, "package") and shipment.package:
        pkg = shipment.package
        c.setFillColor(TEXT_PRIMARY)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin + 0.1 * inch, details_y + 0.25 * inch, "Weight:")

        c.setFont("Helvetica", 9)
        weight_text = (
            f"{getattr(pkg, 'weight_lbs', 0)} lb {getattr(pkg, 'weight_oz', 0)} oz"
        )
        c.drawString(margin + 0.55 * inch, details_y + 0.25 * inch, weight_text)

        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin + 0.1 * inch, details_y, "Dimensions:")

        c.setFont("Helvetica", 9)
        dim_text = f"{getattr(pkg, 'length_inches', '?')} × {getattr(pkg, 'width_inches', '?')} × {getattr(pkg, 'height_inches', '?')} in"
        c.drawString(margin + 0.75 * inch, details_y, dim_text)
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 8)
        c.drawString(
            margin + 0.1 * inch, details_y + 0.1 * inch, "Package details not provided"
        )

    # Footer - Order & Barcode
    footer_y = 1.2 * inch
    order_text = (
        f"Order: {shipment.order_no}"
        if hasattr(shipment, "order_no") and shipment.order_no
        else f"Shipment #{getattr(shipment, 'id', 'UNKNOWN')}"
    )
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(LABEL_4X6_WIDTH / 2, footer_y, order_text)

    tracking_number = _generate_tracking_number(shipment)

    barcode_width = 2.8 * inch
    barcode_height = 0.6 * inch
    barcode_x = (LABEL_4X6_WIDTH - barcode_width) / 2
    barcode_y = 0.35 * inch

    try:
        barcode = code128.Code128(
            tracking_number, barHeight=barcode_height, barWidth=1.2
        )
        barcode.drawOn(c, barcode_x, barcode_y)
        logger.debug("Barcode generated successfully for tracking: %s", tracking_number)
    except Exception as barcode_err:
        logger.warning("Failed to generate Code128 barcode: %s", str(barcode_err))
        c.setStrokeColor(BORDER_COLOR)
        c.setLineWidth(1)
        c.rect(barcode_x, barcode_y, barcode_width, barcode_height, fill=0, stroke=1)
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Courier-Bold", 8)
        c.drawCentredString(
            LABEL_4X6_WIDTH / 2,
            barcode_y + barcode_height / 2,
            f"|||  {tracking_number}  |||",
        )



def _draw_letter_label(c, shipment, position):
    """Draw shipping label on Letter/A4 paper (top or bottom half)."""
    logger.debug(
        "Drawing letter label (position %d) for shipment: %s",
        position,
        getattr(shipment, "order_no", shipment.id),
    )

    label_height = LETTER_HEIGHT / 2
    margin = 0.5 * inch
    y_offset = LETTER_HEIGHT / 2 if position == 0 else 0
    content_width = LETTER_WIDTH - (2 * margin)

    # Draw border
    c.setStrokeColor(BORDER_COLOR)
    c.setLineWidth(2)
    c.rect(margin, y_offset + 0.25 * inch, content_width, label_height - 0.5 * inch)

    y_position = y_offset + label_height - margin - 0.3 * inch

    # ═══════════════════════════════════════════════════
    # HEADER SECTION - Service Type & Price
    # ═══════════════════════════════════════════════════
    header_height = 0.7 * inch
    c.setFillColor(HEADER_BG)
    c.rect(
        margin + 0.1 * inch,
        y_position - header_height + 0.25 * inch,
        content_width - 0.2 * inch,
        header_height,
        fill=1,
        stroke=0,
    )

    # Service name (left)
    c.setFillColor(ACCENT_COLOR)
    c.setFont("Helvetica-Bold", 16)
    service_display = (
        shipment.get_shipping_service_display()
        if hasattr(shipment, "get_shipping_service_display")
        else "Standard Shipping"
    )
    c.drawString(margin + 0.3 * inch, y_position - 0.2 * inch, service_display)

    # Price (right)
    c.setFont("Helvetica-Bold", 18)
    price_text = f"${shipment.price:.2f}" if shipment.price else "$0.00"
    c.drawRightString(
        LETTER_WIDTH - margin - 0.3 * inch, y_position - 0.2 * inch, price_text
    )

    y_position -= header_height + 0.35 * inch

    # ═══════════════════════════════════════════════════
    # Two-column layout: FROM (left) | TO (right)
    # ═══════════════════════════════════════════════════
    column_width = (content_width - 0.3 * inch) / 2
    left_x = margin + 0.15 * inch
    right_x = margin + column_width + 0.3 * inch

    # FROM SECTION (Left Column)
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(left_x, y_position, "FROM:")

    c.setStrokeColor(TEXT_SECONDARY)
    c.setLineWidth(0.5)
    c.line(
        left_x + 0.5 * inch,
        y_position + 0.05 * inch,
        left_x + column_width - 0.15 * inch,
        y_position + 0.05 * inch,
    )

    from_y = y_position - 0.3 * inch

    if shipment.ship_from:
        _draw_address_block(
            c,
            shipment.ship_from,
            left_x,
            from_y,
            left_x + column_width,
            margin,
            is_from=True,
            compact=True,
        )
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(left_x, from_y, "No sender address")

    # TO SECTION (Right Column) - Larger and more prominent
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(right_x, y_position, "SHIP TO:")

    c.setStrokeColor(ACCENT_COLOR)
    c.setLineWidth(1)
    c.line(
        right_x + 0.7 * inch,
        y_position + 0.08 * inch,
        LETTER_WIDTH - margin - 0.15 * inch,
        y_position + 0.08 * inch,
    )

    to_y = y_position - 0.35 * inch

    if shipment.ship_to:
        _draw_address_block(
            c,
            shipment.ship_to,
            right_x,
            to_y,
            LETTER_WIDTH,
            margin,
            is_from=False,
            compact=False,
        )
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 11)
        c.drawString(right_x, to_y, "No recipient address")

    # ═══════════════════════════════════════════════════
    # PACKAGE DETAILS & ORDER INFO (Bottom section)
    # ═══════════════════════════════════════════════════
    bottom_y = y_offset + 1.5 * inch

    c.setStrokeColor(TEXT_SECONDARY)
    c.setLineWidth(0.5)
    c.line(
        margin + 0.1 * inch,
        bottom_y + 0.7 * inch,
        LETTER_WIDTH - margin - 0.1 * inch,
        bottom_y + 0.7 * inch,
    )

    # Left side: Package details
    if shipment.package:
        pkg = shipment.package
        total_oz = (pkg.weight_lbs * 16) + pkg.weight_oz

        c.setFillColor(TEXT_PRIMARY)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(left_x, bottom_y + 0.45 * inch, "PACKAGE DETAILS:")

        c.setFont("Helvetica", 10)
        weight_text = f"Weight: {pkg.weight_lbs} lb {pkg.weight_oz} oz ({total_oz} oz)"
        c.drawString(left_x, bottom_y + 0.2 * inch, weight_text)

        dim_text = f"Dimensions: {pkg.length_inches} × {pkg.width_inches} × {pkg.height_inches} in"
        c.drawString(left_x, bottom_y - 0.05 * inch, dim_text)
    else:
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Helvetica-Oblique", 9)
        c.drawString(left_x, bottom_y + 0.3 * inch, "Package details not provided")

    # Right side: Order number
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", 11)
    order_text = (
        f"Order: {shipment.order_no}"
        if shipment.order_no
        else f"Shipment: #{shipment.id}"
    )
    c.drawString(right_x, bottom_y + 0.45 * inch, order_text)

    # Generate tracking number
    tracking_number = _generate_tracking_number(shipment)

    # Draw real barcode
    barcode_width = 2.5 * inch
    barcode_height = 0.5 * inch
    barcode_x = right_x + 0.2 * inch
    barcode_y = bottom_y - 0.15 * inch

    try:
        # Create Code128 barcode
        barcode = code128.Code128(
            tracking_number, barHeight=barcode_height, barWidth=1.2
        )

        barcode.drawOn(c, barcode_x, barcode_y)

    except Exception:
        # Fallback if barcode generation fails
        c.setStrokeColor(BORDER_COLOR)
        c.setLineWidth(1)
        c.rect(barcode_x, barcode_y, barcode_width, barcode_height, fill=0, stroke=1)
        c.setFillColor(TEXT_SECONDARY)
        c.setFont("Courier-Bold", 8)
        c.drawCentredString(
            barcode_x + barcode_width / 2,
            barcode_y + barcode_height / 2,
            f"|||  {tracking_number}  |||",
        )


def _draw_address_block(
    c, address, x, y, page_width, margin, is_from=False, compact=False
):
    """Draw address block with consistent formatting."""
    line_spacing = 0.15 * inch if is_from else 0.20 * inch
    font_size = 8 if is_from else 11

    # Name
    c.setFillColor(TEXT_PRIMARY)
    c.setFont("Helvetica-Bold", font_size)

    first_name = getattr(address, "first_name", "") or ""
    last_name = getattr(address, "last_name", "") or ""

    if first_name or last_name:
        full_name = f"{first_name} {last_name}".strip()
    else:
        full_name = getattr(address, "name", "RECIPIENT") or "RECIPIENT"

    c.drawString(x, y, full_name[:50])
    y -= line_spacing

    # Address lines
    c.setFont("Helvetica", font_size)

    if address.address_line1:
        c.drawString(x, y, address.address_line1[:55])
        y -= line_spacing

    if address.address_line2 and address.address_line2.strip():
        c.drawString(x, y, address.address_line2[:55])
        y -= line_spacing

    # City, State, ZIP
    city = (address.city or "").strip()
    state = (address.state or "").strip()
    zip_code = (address.zip_code or "").strip()

    city_state_zip = f"{city}, {state} {zip_code}".strip(", ")
    if city_state_zip:
        c.drawString(x, y, city_state_zip[:55])
        y -= line_spacing

    # Phone (optional, only for recipient addresses)
    if (
        not is_from
        and hasattr(address, "phone")
        and address.phone
        and address.phone.strip()
    ):
        c.setFont("Helvetica", font_size - 1)
        c.setFillColor(TEXT_SECONDARY)
        c.drawString(x, y, f"Tel: {address.phone[:20]}")
        y -= line_spacing

    return y


def _generate_tracking_number(shipment):
    """Generate consistent tracking number from shipment data."""
    import hashlib

    base_id = str(
        getattr(shipment, "order_no", None) or getattr(shipment, "id", "UNKNOWN")
    )
    logger.debug("Generating tracking number from base_id: %s", base_id)

    hash_obj = hashlib.md5(base_id.encode())
    hash_hex = hash_obj.hexdigest()[:8].upper()

    service_prefix = (
        "PM" if getattr(shipment, "shipping_service", "") == "priority" else "GS"
    )

    tracking = f"{service_prefix}{hash_hex}"

    digit_sum = sum(int(c, 16) for c in hash_hex if c.isdigit() or c in "ABCDEF")
    checksum = digit_sum % 10

    final_tracking = f"{tracking}{checksum}"
    logger.debug("Generated tracking number: %s", final_tracking)

    return final_tracking
