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
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

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
        logger.debug(f"User {self.request.user.full_name} fetching batches")
        return Batch.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def purchase(self, request, pk=None):
        batch = self.get_object()
        logger.info(
            f"[PURCHASE] User {request.user.full_name} attempting to purchase batch {batch.id} "
            f"(status: {batch.status}, total: ${batch.total_price})"
        )

        if batch.status == "purchased":
            logger.warning(
                f"[PURCHASE] Batch {batch.id} already purchased by {request.user.full_name}"
            )
            return Response({"detail": "Batch already purchased"}, status=400)

        label_format = request.data.get("label_format")
        batch.status = "purchased"
        batch.label_format = label_format
        batch.save(update_fields=["status", "label_format", "updated_at"])

        logger.info(
            f"[PURCHASE] Batch {batch.id} purchased successfully by {request.user.full_name} "
            f"(label_format: {label_format})"
        )
        return Response(BatchSerializer(batch).data)


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
        
        return response


    # ───────────────────────────────────────────────────────────────
    #  POST /shipments/<id>/upsert-address/
    # ───────────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="upsert-address")
    def upsert_address(self, request, pk=None):
        """
        Upsert (update or create) the address for this shipment
        """
        shipment = self.get_object()
        addr_type = request.data.get("type")
        
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

            return Response(
                {
                    "status": "success",
                    "message": "Shipping address updated/created",
                    "address": AddressSerializer(new_address).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ───────────────────────────────────────────────────────────────
    #  POST /shipments/<id>/upsert-package/
    # ───────────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="upsert-package")
    def upsert_package(self, request, pk=None):
        """
        Upsert (update or create) the package details for this shipment
        """
        shipment = self.get_object()

        package = shipment.package
        serializer = PackageSerializer(package, data=request.data, partial=True)

        if serializer.is_valid():
            new_package = serializer.save()

            if not package:
                shipment.package = new_package
                shipment.save(update_fields=["package"])

            return Response(
                {
                    "status": "success",
                    "message": "Package details updated/created",
                    "package": PackageSerializer(new_package).data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CSVUploadView(GenericAPIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        file_obj = request.FILES.get("file")

        logger.info(f"[CSV_UPLOAD] User {user.full_name} initiated CSV upload")

        if not file_obj:
            logger.warning(f"[CSV_UPLOAD] No file provided by {user.full_name}")
            return Response({"error": "No file provided"}, status=400)

        if not file_obj.name.lower().endswith(".csv"):
            logger.warning(
                f"[CSV_UPLOAD] Invalid file type by {user.full_name}: {file_obj.name}"
            )
            return Response({"error": "Only .csv files allowed"}, status=400)

        logger.info(
            f"[CSV_UPLOAD] Processing file {file_obj.name} for user {user.full_name}"
        )

        try:
            file_data = file_obj.read().decode("utf-8-sig")
            csv_reader = csv.reader(io.StringIO(file_data))
            rows = list(csv_reader)

            logger.debug(f"[CSV_UPLOAD] Total rows in CSV: {len(rows)}")

            data_rows = rows[2:]  # skip headers

            if not data_rows:
                logger.warning(f"[CSV_UPLOAD] Empty CSV from {user.full_name}")
                return Response({"error": "CSV is empty"}, status=400)

            if len(data_rows) > 500:
                logger.warning(
                    f"[CSV_UPLOAD] Too many rows ({len(data_rows)}) from {user.full_name}"
                )
                return Response({"error": "Max 500 rows allowed"}, status=400)

            batch = Batch.objects.create(
                user=user, name=f"Upload - {file_obj.name} ({len(data_rows)} items)"
            )
            logger.info(
                f"[CSV_UPLOAD] Created batch {batch.id} for user {user.full_name} "
                f"with {len(data_rows)} rows to process"
            )

            created = 0
            issues = 0
            issue_details = []

            for idx, row in enumerate(data_rows, start=1):
                try:
                    logger.debug(
                        f"[CSV_UPLOAD] Processing row {idx} of batch {batch.id}"
                    )

                    # Validate row length
                    if len(row) < 23:
                        issue_msg = f"Row {idx}: Insufficient columns ({len(row)}/23)"
                        logger.warning(f"[CSV_UPLOAD] {issue_msg}")
                        issue_details.append(issue_msg)
                        issues += 1
                        continue

                    # Validate required field: to_address_line1
                    if not row[9].strip():
                        issue_msg = f"Row {idx}: Missing required to_address_line1"
                        logger.warning(f"[CSV_UPLOAD] {issue_msg}")
                        issue_details.append(issue_msg)
                        issues += 1
                        continue

                    # Create Ship From Address (only if meaningful data exists)
                    ship_from = None
                    if row[2].strip():  # from_address_line1 present
                        try:
                            first_name = row[0].strip()
                            last_name = row[1].strip()
                            name = f"{first_name} {last_name}".strip()

                            if not name:
                                name = "Unknown Sender"

                            ship_from, created_from = Address.objects.get_or_create(
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
                                f"[CSV_UPLOAD] Row {idx}: Ship from address "
                                f"{'created' if created_from else 'found'} (ID: {ship_from.id})"
                            )
                        except Exception as e:
                            logger.error(
                                f"[CSV_UPLOAD] Row {idx}: Error creating ship_from address: {str(e)}"
                            )
                            ship_from = None

                    # Create Ship To Address (required)
                    try:
                        first_name = row[7].strip() if len(row) > 7 else row[0].strip()
                        last_name = row[8].strip() if len(row) > 8 else row[1].strip()
                        name = f"{first_name} {last_name}".strip()

                        if not name:
                            name = "Unknown Recipient"

                        ship_to, created_to = Address.objects.get_or_create(
                            address_line1=row[9].strip(),
                            city=row[11].strip(),
                            state=row[13].strip(),
                            zip_code=row[12].strip(),
                            defaults={
                                "name": name,
                                "first_name": first_name or "Unknown",
                                "last_name": last_name or "Recipient",
                                "address_line2": row[10].strip(),
                                "phone": row[20].strip()
                                if len(row) > 20
                                else row[19].strip(),
                            },
                        )
                        logger.debug(
                            f"[CSV_UPLOAD] Row {idx}: Ship to address "
                            f"{'created' if created_to else 'found'} (ID: {ship_to.id})"
                        )
                    except Exception as e:
                        logger.error(
                            f"[CSV_UPLOAD] Row {idx}: Error creating ship_to address: {str(e)}"
                        )
                        issue_msg = f"Row {idx}: Failed to create ship_to address"
                        issue_details.append(issue_msg)
                        issues += 1
                        continue

                    # Match or create package
                    package = None
                    try:
                        weight_lbs = int(row[14]) if row[14].strip().isdigit() else 0
                        weight_oz = int(row[15]) if row[15].strip().isdigit() else 0

                        if row[22].strip():  # SKU provided
                            length = float(row[16]) if row[16].strip() else None
                            width = float(row[17]) if row[17].strip() else None
                            height = float(row[18]) if row[18].strip() else None

                            package, created_pkg = Package.objects.get_or_create(
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
                            logger.debug(
                                f"[CSV_UPLOAD] Row {idx}: Package with SKU "
                                f"{'created' if created_pkg else 'found'} (ID: {package.id})"
                            )
                        elif row[16] or row[17] or row[18]:
                            # No SKU, create package based on dimensions
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
                            logger.debug(
                                f"[CSV_UPLOAD] Row {idx}: Package without SKU created (ID: {package.id})"
                            )
                    except Exception as e:
                        logger.error(
                            f"[CSV_UPLOAD] Row {idx}: Error creating package: {str(e)}"
                        )
                        issue_msg = f"Row {idx}: Failed to create package"
                        issue_details.append(issue_msg)
                        issues += 1
                        continue

                    # Create shipment
                    try:
                        shipment = Shipment.objects.create(
                            batch=batch,
                            ship_from=ship_from,
                            ship_to=ship_to,
                            package=package,
                            order_no=row[21].strip() or f"ORDER-{idx}",
                        )
                        logger.debug(
                            f"[CSV_UPLOAD] Row {idx}: Shipment created (ID: {shipment.id}, "
                            f"order_no: {shipment.order_no})"
                        )

                        # Validate shipment
                        if not shipment.ship_to:
                            logger.warning(
                                f"[CSV_UPLOAD] Row {idx}: Shipment {shipment.id} missing ship_to"
                            )
                            shipment.status = "incomplete"
                            shipment.save(update_fields=["status"])
                        elif not shipment.package or (
                            shipment.package.weight_lbs + shipment.package.weight_oz
                            == 0
                        ):
                            logger.warning(
                                f"[CSV_UPLOAD] Row {idx}: Shipment {shipment.id} has invalid package weight"
                            )
                            shipment.status = "incomplete"
                            shipment.save(update_fields=["status"])

                        created += 1

                    except Exception as e:
                        logger.error(
                            f"[CSV_UPLOAD] Row {idx}: Error creating shipment: {str(e)}"
                        )
                        issue_msg = f"Row {idx}: Failed to create shipment"
                        issue_details.append(issue_msg)
                        issues += 1
                        continue

                except Exception as e:
                    logger.error(
                        f"[CSV_UPLOAD] Row {idx}: Unexpected error: {str(e)}",
                        exc_info=True,
                    )
                    issue_msg = f"Row {idx}: Unexpected error - {str(e)}"
                    issue_details.append(issue_msg)
                    issues += 1
                    continue

            # Calculate batch total
            batch.calculate_total()
            logger.info(
                f"[CSV_UPLOAD] Batch {batch.id} processing complete: "
                f"{created} shipments created, {issues} issues, "
                f"total price: ${batch.total_price}"
            )

            if issue_details:
                logger.info(
                    f"[CSV_UPLOAD] Issue details for batch {batch.id}: {issue_details[:10]}"
                )

            return Response(
                {
                    "batch_id": str(batch.id),
                    "total_records": created,
                    "issues": issues,
                    "issue_details": issue_details[:10],  # Return first 10 issues
                    "total_price": str(batch.total_price),
                    "preview": ShipmentSerializer(
                        batch.shipments.all()[:5], many=True
                    ).data,
                },
                status=201,
            )

        except Exception as exc:
            logger.error(
                f"[CSV_UPLOAD] Critical failure for user {user.full_name}: {str(exc)}",
                exc_info=True,
            )
            if "batch" in locals():
                logger.info(f"[CSV_UPLOAD] Rolling back batch {batch.id}")
                batch.delete()
            return Response(
                {"error": "CSV processing failed", "detail": str(exc)}, status=500
            )


class BulkUpdateView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, batch_id):
        batch = get_object_or_404(Batch, id=batch_id, user=request.user)
        action = request.data.get("action")
        shipment_ids = request.data.get("shipment_ids", [])

        logger.info(
            f"[BULK_UPDATE] User {request.user.full_name} performing '{action}' "
            f"on batch {batch_id} with {len(shipment_ids)} shipments"
        )

        if not shipment_ids:
            logger.warning(
                f"[BULK_UPDATE] No shipment IDs provided by {request.user.full_name}"
            )
            return Response({"error": "No shipment IDs"}, status=400)

        updated_count = 0

        try:
            if action == "change_address":
                address_id = request.data.get("address_id")
                if not address_id:
                    logger.warning(
                        f"[BULK_UPDATE] No address_id provided by {request.user.full_name}"
                    )
                    return Response({"error": "No address_id provided"}, status=400)

                address = get_object_or_404(Address, id=address_id)
                logger.debug(
                    f"[BULK_UPDATE] Changing address to {address.id} for batch {batch_id}"
                )

                updated_count = Shipment.objects.filter(
                    batch=batch, id__in=shipment_ids
                ).update(ship_from=address)

                logger.info(
                    f"[BULK_UPDATE] Changed ship_from address for {updated_count} shipments"
                )

            elif action == "change_package":
                package_id = request.data.get("package_id")
                if not package_id:
                    logger.warning(
                        f"[BULK_UPDATE] No package_id provided by {request.user.full_name}"
                    )
                    return Response({"error": "No package_id provided"}, status=400)

                package = get_object_or_404(Package, id=package_id)
                logger.debug(
                    f"[BULK_UPDATE] Changing package to {package.id} for batch {batch_id}"
                )

                updated_count = Shipment.objects.filter(
                    batch=batch, id__in=shipment_ids
                ).update(package=package)

                logger.info(
                    f"[BULK_UPDATE] Changed package for {updated_count} shipments, recalculating prices"
                )

                # Recalculate prices
                shipments = batch.shipments.filter(id__in=shipment_ids)
                for s in shipments:
                    s.save(update_fields=["price"])
                logger.debug(
                    f"[BULK_UPDATE] Recalculated prices for {shipments.count()} shipments"
                )

            elif action == "change_service":
                service = request.data.get("service")
                if not service:
                    logger.warning(
                        f"[BULK_UPDATE] No service provided by {request.user.full_name}"
                    )
                    return Response({"error": "No service provided"}, status=400)

                if service not in dict(Shipment.SERVICE_CHOICES):
                    logger.warning(
                        f"[BULK_UPDATE] Invalid service '{service}' by {request.user.full_name}"
                    )
                    return Response({"error": "Invalid service"}, status=400)

                logger.debug(
                    f"[BULK_UPDATE] Changing service to '{service}' for batch {batch_id}"
                )

                updated_count = Shipment.objects.filter(
                    batch=batch, id__in=shipment_ids
                ).update(shipping_service=service)

                logger.info(
                    f"[BULK_UPDATE] Changed service for {updated_count} shipments, recalculating prices"
                )

                shipments = batch.shipments.filter(id__in=shipment_ids)
                for s in shipments:
                    s.save(update_fields=["price"])
                logger.debug(
                    f"[BULK_UPDATE] Recalculated prices for {shipments.count()} shipments"
                )

            else:
                logger.warning(
                    f"[BULK_UPDATE] Unknown action '{action}' by {request.user.full_name}"
                )
                return Response({"error": "Unknown action"}, status=400)

            batch.calculate_total()
            logger.info(
                f"[BULK_UPDATE] Batch {batch_id} bulk update complete: "
                f"action={action}, updated={updated_count}, new_total=${batch.total_price}"
            )

            return Response(
                {
                    "status": "success",
                    "updated_count": updated_count,
                    "new_total": str(batch.total_price),
                }
            )

        except Exception as e:
            logger.error(
                f"[BULK_UPDATE] Error during bulk update for batch {batch_id}: {str(e)}",
                exc_info=True,
            )
            return Response(
                {"error": "Bulk update failed", "detail": str(e)}, status=500
            )
