import csv
import io
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.http import HttpResponse

from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.services import generate_shipping_labels_pdf

from .models import Batch, Shipment, Address, Package
from .serializers import (
    BatchSerializer,
    ShipmentSerializer,
    AddressSerializer,
    PackageSerializer,
)
from .filters import BatchFilter, ShipmentFilter

logger = logging.getLogger(__name__)


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.filter(saved=True)
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]


class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.filter(saved=True)
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]


class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BatchFilter
    search_fields = ["name", "status"]
    ordering_fields = ["created_at", "total_price", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        logger.debug("User %s (id:%s) fetching their batches", 
                     self.request.user.full_name, self.request.user.id)
        return Batch.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def purchase(self, request, pk=None):
        batch = self.get_object()
        
        logger.info(
            "Purchase attempt | batch=%d | user=%s (id:%d) | status=%s | total=%.2f",
            batch.id, request.user.full_name, request.user.id, 
            batch.status, batch.total_price or 0
        )

        if batch.status == "purchased":
            logger.warning(
                "Attempt to repurchase already purchased batch | "
                "batch=%d | user=%s (id:%d)",
                batch.id, request.user.full_name, request.user.id
            )
            return Response({"detail": "Batch already purchased"}, status=400)

        label_format = request.data.get("label_format")
        
        if not label_format:
            logger.warning(
                "Purchase request without label_format | batch=%d | user=%s | using default",
                batch.id, request.user.full_name
            )

        old_status = batch.status
        batch.status = "purchased"
        batch.label_format = label_format
        batch.save(update_fields=["status", "label_format", "updated_at"])

        logger.info(
            "Batch purchased successfully | batch=%d | user=%s | %s → purchased | "
            "label_format=%s | total=%.2f",
            batch.id, request.user.full_name, old_status, 
            label_format or "not-specified", batch.total_price or 0
        )
        
        return Response(BatchSerializer(batch).data)
    
    @action(detail=True, methods=["get"], url_path="labels")
    def download_labels(self, request, pk=None):
        batch = self.get_object()

        if batch.status != "purchased":
            logger.warning(
                "Labels download attempt on non-purchased batch | "
                "batch=%d | user=%s | current_status=%s",
                batch.id, request.user.full_name, batch.status
            )
            return Response(
                {"detail": "Batch must be purchased before downloading labels"},
                status=400
            )

        shipments_count = batch.shipments.count()
        if shipments_count == 0:
            logger.warning(
                "Labels download requested for empty batch | "
                "batch=%d | user=%s",
                batch.id, request.user.full_name
            )
            return Response({"detail": "No shipments in batch"}, status=400)

        logger.info(
            "Starting label PDF generation | batch=%d | user=%s | shipments=%d | format=%s",
            batch.id, request.user.full_name, shipments_count, batch.label_format
        )

        try:
            shipments = batch.shipments.select_related(
                "ship_from", "ship_to", "package"
            ).order_by("id")
            
            pdf_buffer = generate_shipping_labels_pdf(shipments)
            
            buffer_size = pdf_buffer.tell()
            pdf_buffer.seek(0)
            
            logger.debug(
                "Label PDF generated successfully | batch=%d | size=%d bytes",
                batch.id, buffer_size
            )
        except Exception as e:
            logger.error(
                "Failed to generate shipping labels PDF | batch=%d | error=%s",
                batch.id, str(e), exc_info=True
            )
            return Response(
                {"detail": "Failed to generate labels PDF"},
                status=500
            )

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="labels-batch-{batch.id}.pdf"'
        response.write(pdf_buffer.getvalue())

        logger.info(
            "Labels PDF successfully served | batch=%d | user=%s | size=%d bytes",
            batch.id, request.user.full_name, len(response.content)
        )

        return response


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ShipmentFilter
    ordering_fields = [
        "created_at",
        "price",
        "order_no",
        "ship_to__name",
        "ship_from__name",
    ]
    queryset = Shipment.objects.all()
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        queryset = self.filter_queryset(self.get_queryset())
        total_price = queryset.aggregate(total=Sum('price'))['total'] or 0.00
        
        response.data['total_prices'] = str(total_price)
        
        logger.debug(
            "Shipments list returned | user=%s | count=%d | total_price=%.2f",
            request.user.full_name, len(response.data.get('results', [])), total_price
        )
        
        return response

    @action(detail=True, methods=["post"], url_path="upsert-address")
    def upsert_address(self, request, pk=None):
        shipment = self.get_object()
        addr_type = request.data.get("type")
        
        logger.info(
            "Upsert address request | shipment=%d | type=%s | user=%s",
            shipment.id, addr_type, request.user.full_name
        )

        address = shipment.ship_to if addr_type == "to" else shipment.ship_from
        
        serializer = AddressSerializer(address, data=request.data, partial=True)

        if serializer.is_valid():
            new_address = serializer.save()

            if not address or not address.id:
                if addr_type == "to":
                    shipment.ship_to = new_address
                    shipment.save(update_fields=["ship_to"])
                elif addr_type == "from":
                    shipment.ship_from = new_address
                    shipment.save(update_fields=["ship_from"])

            logger.info(
                "Address upsert successful | shipment=%d | address=%d | type=%s",
                shipment.id, new_address.id, addr_type
            )

            return Response(
                {
                    "status": "success",
                    "message": "Shipping address updated/created",
                    "address": AddressSerializer(new_address).data,
                },
                status=status.HTTP_200_OK,
            )

        logger.warning(
            "Address upsert validation failed | shipment=%d | type=%s | errors=%s",
            shipment.id, addr_type, serializer.errors
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="upsert-package")
    def upsert_package(self, request, pk=None):
        shipment = self.get_object()

        logger.info(
            "Upsert package request | shipment=%d | user=%s",
            shipment.id, request.user.full_name
        )

        package = shipment.package
        serializer = PackageSerializer(package, data=request.data, partial=True)

        if serializer.is_valid():
            new_package = serializer.save()

            if not package:
                shipment.package = new_package
                shipment.save(update_fields=["package"])

            logger.info(
                "Package upsert successful | shipment=%d | package=%d",
                shipment.id, new_package.id
            )

            return Response(
                {
                    "status": "success",
                    "message": "Package details updated/created",
                    "package": PackageSerializer(new_package).data,
                },
                status=status.HTTP_200_OK,
            )

        logger.warning(
            "Package upsert validation failed | shipment=%d | errors=%s",
            shipment.id, serializer.errors
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CSVUploadView(GenericAPIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        file_obj = request.FILES.get("file")

        if not file_obj:
            logger.warning("CSV upload attempt with no file | user=%s (id:%d)", 
                          user.full_name, user.id)
            return Response({"error": "No file provided"}, status=400)

        logger.info(
            "CSV upload started | user=%s (id:%d) | filename=%s | size=%d bytes",
            user.full_name, user.id, file_obj.name, file_obj.size
        )

        if not file_obj.name.lower().endswith(".csv"):
            logger.warning(
                "Invalid file type uploaded | user=%s | filename=%s",
                user.full_name, file_obj.name
            )
            return Response({"error": "Only .csv files allowed"}, status=400)

        try:
            file_data = file_obj.read().decode("utf-8-sig")
            csv_reader = csv.reader(io.StringIO(file_data))
            rows = list(csv_reader)

            logger.debug("CSV file parsed successfully | rows_total=%d", len(rows))

            data_rows = rows[2:]  # skip headers

            if not data_rows:
                logger.warning("CSV contains no data rows after headers | user=%s", 
                              user.full_name)
                return Response({"error": "CSV is empty"}, status=400)

            if len(data_rows) > 500:
                logger.warning(
                    "CSV exceeds row limit | user=%s | rows=%d | max=500 | filename=%s",
                    user.full_name, len(data_rows), file_obj.name
                )
                return Response({"error": "Max 500 rows allowed"}, status=400)

            batch = Batch.objects.create(
                user=user,
                name=f"Upload - {file_obj.name} ({len(data_rows)} items)"
            )

            logger.info(
                "Batch created from CSV upload | batch=%d | user=%s | rows=%d | filename=%s",
                batch.id, user.full_name, len(data_rows), file_obj.name
            )

            created = 0
            issues = 0
            issue_details = []

            for idx, row in enumerate(data_rows, start=1):
                try:
                    if len(row) < 23:
                        raise ValueError(f"Insufficient columns ({len(row)}/23)")

                    if not row[9].strip():
                        raise ValueError("Missing required to_address_line1")

                    # ── Ship From Address ──
                    ship_from = None
                    if row[2].strip():
                        try:
                            first_name = row[0].strip()
                            last_name = row[1].strip()
                            name = f"{first_name} {last_name}".strip() or "Unknown Sender"

                            ship_from, created_flag = Address.objects.get_or_create(
                                address_line1=row[2].strip(),
                                city=row[4].strip(),
                                state=row[6].strip(),
                                zip_code=row[5].strip(),
                                defaults={
                                    "name": name,
                                    "first_name": first_name or "Unknown",
                                    "last_name": last_name or "Sender",
                                    "address_line2": row[3].strip(),
                                    "phone": row[19].strip(),
                                },
                            )
                            logger.debug(
                                "Row %d: Ship-from address %s (id:%d)",
                                idx, "created" if created_flag else "reused", ship_from.id
                            )
                        except Exception as e:
                            logger.warning("Row %d: Failed to process ship-from address - %s", idx, str(e))

                    # ── Ship To Address (required) ──
                    try:
                        first_name = row[7].strip() if len(row) > 7 else ""
                        last_name = row[8].strip() if len(row) > 8 else ""
                        name = f"{first_name} {last_name}".strip() or "Unknown Recipient"

                        ship_to, created_flag = Address.objects.get_or_create(
                            address_line1=row[9].strip(),
                            city=row[11].strip(),
                            state=row[13].strip(),
                            zip_code=row[12].strip(),
                            defaults={
                                "name": name,
                                "first_name": first_name or "Unknown",
                                "last_name": last_name or "Recipient",
                                "address_line2": row[10].strip(),
                                "phone": row[20].strip() if len(row) > 20 else row[19].strip(),
                            },
                        )
                        logger.debug(
                            "Row %d: Ship-to address %s (id:%d)",
                            idx, "created" if created_flag else "reused", ship_to.id
                        )
                    except Exception as e:
                        raise ValueError(f"Failed to create ship-to address: {str(e)}")

                    # ── Package handling ──
                    package = None
                    try:
                        weight_lbs = int(row[14]) if row[14].strip().isdigit() else 0
                        weight_oz = int(row[15]) if row[15].strip().isdigit() else 0

                        if row[22].strip():  # SKU provided
                            length = float(row[16]) if row[16].strip() else None
                            width = float(row[17]) if row[17].strip() else None
                            height = float(row[18]) if row[18].strip() else None

                            package, created_flag = Package.objects.get_or_create(
                                sku=row[22].strip(),
                                defaults={
                                    "name": f"Package for {row[21].strip() or 'order'}",
                                    "length_inches": length,
                                    "width_inches": width,
                                    "height_inches": height,
                                    "weight_lbs": weight_lbs,
                                    "weight_oz": weight_oz,
                                    "saved": False,
                                },
                            )
                        elif any([row[16].strip(), row[17].strip(), row[18].strip()]):
                            length = float(row[16]) if row[16].strip() else 0
                            width = float(row[17]) if row[17].strip() else 0
                            height = float(row[18]) if row[18].strip() else 0

                            package = Package.objects.create(
                                name=f"Package for {row[21].strip() or 'order'}",
                                length_inches=length,
                                width_inches=width,
                                height_inches=height,
                                weight_lbs=weight_lbs,
                                weight_oz=weight_oz,
                                saved=False,
                                user=user,
                            )
                            logger.debug("Row %d: Created dimension-based package (id:%d)", idx, package.id)

                    except Exception as e:
                        raise ValueError(f"Package processing failed: {str(e)}")

                    # ── Create Shipment ──
                    shipment = Shipment.objects.create(
                        batch=batch,
                        ship_from=ship_from,
                        ship_to=ship_to,
                        package=package,
                        order_no=row[21].strip() or f"ORDER-{idx}",
                    )

                    # Basic validation & status
                    if not shipment.ship_to:
                        shipment.status = "incomplete"
                        shipment.save(update_fields=["status"])
                        logger.warning("Row %d: Shipment created without ship-to → marked incomplete", idx)
                    elif not shipment.package or (shipment.package.weight_lbs + shipment.package.weight_oz == 0):
                        shipment.status = "incomplete"
                        shipment.save(update_fields=["status"])
                        logger.warning("Row %d: Shipment created with invalid weight → marked incomplete", idx)

                    created += 1
                    logger.debug("Row %d: Shipment created successfully (id:%d)", idx, shipment.id)

                except Exception as row_error:
                    issues += 1
                    msg = f"Row {idx}: {str(row_error)}"
                    issue_details.append(msg)
                    logger.warning(msg)

            batch.calculate_total()

            logger.info(
                "CSV processing completed | batch=%d | created=%d | issues=%d | total=%.2f | user=%s",
                batch.id, created, issues, batch.total_price or 0, user.full_name
            )

            response_data = {
                "batch_id": str(batch.id),
                "total_records": created,
                "issues": issues,
                "total_price": str(batch.total_price or "0.00"),
            }

            if issue_details:
                response_data["issue_details"] = issue_details[:10]
                logger.info("First 10 issues: %s", issue_details[:10])

            return Response(response_data, status=201)

        except Exception as exc:
            logger.error(
                "Critical CSV processing failure | user=%s | filename=%s | error=%s",
                user.full_name, file_obj.name if 'file_obj' in locals() else "unknown", 
                str(exc), exc_info=True
            )
            if 'batch' in locals() and batch.pk:
                logger.info("Deleting failed batch %d", batch.id)
                batch.delete()
            return Response(
                {"error": "CSV processing failed", "detail": str(exc)},
                status=500
            )

class BulkUpdateView(GenericAPIView):
    """
    API endpoint for bulk-updating multiple shipments in a batch.
    
    Important: Because we use queryset .update() for performance in bulk operations,
    Django **does NOT** trigger model signals (pre_save / post_save).
    
    Solution implemented here:
    1. Perform fast bulk .update() first
    2. Then fetch affected shipments and call .save() on each one
       → this triggers the pre_save signal → validation + price recalculation
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, batch_id):
        batch = get_object_or_404(Batch, id=batch_id, user=request.user)
        action = request.data.get("action")
        shipment_ids = request.data.get("shipment_ids", [])

        if not shipment_ids:
            logger.warning(
                "Bulk update attempted with no shipment IDs | batch=%d | user=%s",
                batch_id, request.user.full_name
            )
            return Response({"error": "No shipment IDs provided"}, status=400)

        logger.info(
            "Bulk update started | action=%s | batch=%d | shipments=%d | user=%s",
            action, batch_id, len(shipment_ids), request.user.full_name
        )

        updated_count = 0

        # Fields that the pre_save signal will update/refresh
        SIGNAL_UPDATED_FIELDS = ['price', 'status', 'error_message']

        try:
            # ────────────────────────────────────────────────────────────────
            # 1. Fast bulk update (does NOT trigger signals)
            # ────────────────────────────────────────────────────────────────
            if action == "change_address":
                address_id = request.data.get("address_id")
                if not address_id:
                    return Response({"error": "address_id is required for change_address"}, status=400)

                address = get_object_or_404(Address, id=address_id)

                updated_count = Shipment.objects.filter(
                    batch=batch,
                    id__in=shipment_ids
                ).update(ship_from=address)

                logger.info(
                    "Bulk change_address completed | batch=%d | new_address=%d | affected=%d",
                    batch_id, address.id, updated_count
                )

            elif action == "change_package":
                package_id = request.data.get("package_id")
                if not package_id:
                    return Response({"error": "package_id is required for change_package"}, status=400)

                package = get_object_or_404(Package, id=package_id)

                updated_count = Shipment.objects.filter(
                    batch=batch,
                    id__in=shipment_ids
                ).update(package=package)

                logger.info(
                    "Bulk change_package completed | batch=%d | new_package=%d | affected=%d",
                    batch_id, package.id, updated_count
                )

            elif action == "change_service":
                service = request.data.get("service")
                if not service:
                    return Response({"error": "service is required for change_service"}, status=400)

                if service not in dict(Shipment.SERVICE_CHOICES):
                    logger.warning("Invalid shipping service attempted: %s", service)
                    return Response({"error": "Invalid shipping service"}, status=400)

                updated_count = Shipment.objects.filter(
                    batch=batch,
                    id__in=shipment_ids
                ).update(shipping_service=service)

                logger.info(
                    "Bulk change_service completed | batch=%d | new_service=%s | affected=%d",
                    batch_id, service, updated_count
                )

            else:
                logger.warning("Unsupported bulk action requested: %s", action)
                return Response({"error": f"Unknown action: {action}"}, status=400)

            # ────────────────────────────────────────────────────────────────
            # 2. Re-validate & re-price → trigger pre_save signal
            # ────────────────────────────────────────────────────────────────
            if updated_count > 0:
                # We fetch with select_related to reduce query count inside the signal
                shipments_to_revalidate = Shipment.objects.filter(
                    id__in=shipment_ids
                ).select_related(
                    'ship_from',
                    'ship_to',
                    'package'
                )

                revalidated_count = 0

                for shipment in shipments_to_revalidate.iterator(chunk_size=100):
                    # Calling .save() here **will trigger** the pre_save signal
                    # which does validation + price calculation
                    shipment.save(update_fields=SIGNAL_UPDATED_FIELDS)
                    revalidated_count += 1

                logger.info(
                    "Re-validation & repricing completed | "
                    "batch=%d | action=%s | revalidated=%d / original_updated=%d",
                    batch_id, action, revalidated_count, updated_count
                )

            # Always recalculate batch total after any changes
            batch.calculate_total()

            return Response({
                "status": "success",
                "action": action,
                "updated_count": updated_count,
                "new_batch_total": str(batch.total_price or "0.00")
            }, status=status.HTTP_200_OK)

        except Exception as exc:
            logger.error(
                "Bulk update failed | batch=%d | action=%s | error=%s",
                batch_id, action, str(exc), exc_info=True
            )
            return Response(
                {"error": "Bulk update failed", "detail": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )