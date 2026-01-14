from io import BytesIO
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import gray

LABEL_WIDTH = 4 * inch
LABEL_HEIGHT = 6 * inch


def generate_shipping_labels_pdf(shipments, label_format="4x6"):
    """
    Generate multi-page PDF with one 4x6 label per page
    Returns BytesIO buffer ready to be sent as HttpResponse
    """
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(LABEL_WIDTH, LABEL_HEIGHT))

    for i, shipment in enumerate(shipments, 1):
        if i > 1:
            c.showPage()

        _draw_single_4x6_label(c, shipment)

    c.save()
    buffer.seek(0)
    return buffer


def _draw_single_4x6_label(c, shipment):
    """Very simplified layout - customize heavily!"""
    y = LABEL_HEIGHT - 0.3 * inch

    # ── Sender ────────────────────────────────────────
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.3 * inch, y, "FROM:")
    y -= 0.25 * inch

    c.setFont("Helvetica", 9)
    if shipment.ship_from:
        addr = shipment.ship_from
        lines = [
            f"{addr.first_name} {addr.last_name}".strip(),
            addr.address_line1,
        ]
        if addr.address_line2.strip():
            lines.append(addr.address_line2)
        lines.extend([f"{addr.city}, {addr.state} {addr.zip_code}"])

        for line in lines:
            c.drawString(0.3 * inch, y, line[:45])
            y -= 0.18 * inch

    y -= 0.3 * inch

    # ── Recipient ─────────────────────────────────────
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.3 * inch, y, "TO:")
    y -= 0.25 * inch

    c.setFont("Helvetica-Bold", 10)
    if shipment.ship_to:
        addr = shipment.ship_to
        name = f"{addr.first_name} {addr.last_name}".strip() or "UNKNOWN"
        c.drawString(0.3 * inch, y, name[:40])
        y -= 0.22 * inch

        c.setFont("Helvetica", 10)
        lines = [addr.address_line1]
        if addr.address_line2.strip():
            lines.append(addr.address_line2)
        lines.extend([f"{addr.city}, {addr.state} {addr.zip_code}"])

        for line in lines:
            c.drawString(0.3 * inch, y, line[:45])
            y -= 0.20 * inch

    # ── Bottom part ───────────────────────────────────
    y = 1.8 * inch

    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(LABEL_WIDTH / 2, y, f"Order: {shipment.order_no or '—'}")
    y -= 0.4 * inch

    if shipment.package:
        pkg = shipment.package
        total_oz = pkg.weight_lbs * 16 + pkg.weight_oz
        c.setFont("Helvetica", 10)
        c.drawString(0.3 * inch, y, f"Weight: {pkg.weight_lbs} lb {pkg.weight_oz} oz  ({total_oz} oz)")
        y -= 0.22 * inch
        c.drawString(0.3 * inch, y,
                     f"Dim: {pkg.length_inches}×{pkg.width_inches}×{pkg.height_inches} in")

    # Service & Price (right side)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(LABEL_WIDTH - 0.3 * inch, 2.8 * inch,
                      shipment.get_shipping_service_display())
    c.drawRightString(LABEL_WIDTH - 0.3 * inch, 2.4 * inch,
                      f"${shipment.price:.2f}")

    # Simple barcode placeholder
    c.setFont("Helvetica", 8)
    c.setFillColor(gray)
    c.drawCentredString(LABEL_WIDTH / 2, 0.6 * inch, f"* {shipment.order_no or shipment.id} *")
    c.rect(1.2 * inch, 0.4 * inch, 1.6 * inch, 0.9 * inch, fill=0)