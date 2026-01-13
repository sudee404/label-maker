import csv
import io
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from .models import Batch, Shipment, Address, Package
from .serializers import (
    BatchSerializer,
    ShipmentSerializer,
    AddressSerializer,
    PackageSerializer,
)
from .filters import BatchFilter, ShipmentFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)


class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)


class BatchViewSet(viewsets.ModelViewSet):
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = BatchFilter
    search_fields = ["name", "status"]
    ordering_fields = ["created_at", "total_price", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Batch.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def purchase(self, request, pk=None):
        batch = self.get_object()
        logger.info(
            f"User {request.user.username} is purchasing batch {batch.id} "
            f"(total: ${batch.total_price})"
        )

        if batch.status == "purchased":
            return Response(
                {"detail": "Batch already purchased"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        batch.status = "purchased"
        batch.label_format = request.data.get("label_format")
        batch.save(update_fields=["status", "label_format", "updated_at"])

        logger.info(
            f"Batch {batch.id} successfully purchased by {request.user.username}"
        )
        return Response(BatchSerializer(batch).data)


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ShipmentFilter
    search_fields = ["order_no", "to_first_name", "to_last_name", "to_city"]
    ordering_fields = ["created_at", "weight_lbs", "price"]

    def get_queryset(self):
        queryset = Shipment.objects.all()
        batch_id = self.request.query_params.get("batch_id")
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset.filter(batch__user=self.request.user)


class CSVUploadView(GenericAPIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    serializer_class = None

    def post(self, request):
        user = request.user
        file_obj = request.FILES.get("file")

        if not file_obj:
            logger.warning(
                f"No file provided in upload request by user {user.username}"
            )
            return Response({"error": "No file provided"}, status=400)

        if not file_obj.name.lower().endswith(".csv"):
            logger.warning(
                f"Invalid file type uploaded by {user.username}: {file_obj.name}"
            )
            return Response({"error": "Only .csv files are allowed"}, status=400)

        try:
            file_data = file_obj.read().decode("utf-8-sig")  # handles BOM if present
            csv_reader = csv.reader(io.StringIO(file_data))
            rows = list(csv_reader)

            # Skip the two header rows
            data_rows = rows[2:]

            if len(data_rows) == 0:
                return Response({"error": "CSV file is empty"}, status=400)

            if len(data_rows) > 500:  # reasonable limit for assessment
                return Response({"error": "Too many rows (max 500)"}, status=400)

            batch = Batch.objects.create(
                user=user, name=f"Upload - {file_obj.name} - {file_obj.size} bytes"
            )
            logger.info(
                f"User {user.username} created new batch {batch.id} "
                f"({len(data_rows)} potential records)"
            )

            created = 0
            issues = 0

            for row in data_rows:
                if len(row) < 23 or not row[9].strip():  # to_address_line1 required
                    issues += 1
                    continue

                shipment = Shipment.objects.create(
                    batch=batch,
                    # From
                    from_first_name=row[0].strip(),
                    from_last_name=row[1].strip(),
                    from_address_line1=row[2].strip(),
                    from_address_line2=row[3].strip(),
                    from_city=row[4].strip(),
                    from_zip_code=row[5].strip(),
                    from_state=row[6].strip(),
                    # To
                    to_first_name=row[7].strip(),
                    to_last_name=row[8].strip(),
                    to_address_line1=row[9].strip(),
                    to_address_line2=row[10].strip(),
                    to_city=row[11].strip(),
                    to_zip_code=row[12].strip(),
                    to_state=row[13].strip(),
                    # Package
                    weight_lbs=int(row[14]) if row[14].strip().isdigit() else 0,
                    weight_oz=int(row[15]) if row[15].strip().isdigit() else 0,
                    length_inches=float(row[16]) if row[16].strip() else None,
                    width_inches=float(row[17]) if row[17].strip() else None,
                    height_inches=float(row[18]) if row[18].strip() else None,
                    # Other
                    phone_num1=row[19].strip(),
                    phone_num2=row[20].strip(),
                    order_no=row[21].strip(),
                    item_sku=row[22].strip(),
                )

                # Basic validation
                if (
                    not shipment.to_zip_code
                    or shipment.weight_lbs + shipment.weight_oz == 0
                ):
                    shipment.status = "incomplete"
                    shipment.save(update_fields=["status"])

                created += 1

            batch.calculate_total()
            logger.info(
                f"Batch {batch.id} processed successfully: "
                f"{created} shipments created, {issues} skipped/invalid"
            )

            return Response(
                {
                    "batch_id": batch.id,
                    "total_records": created,
                    "issues": issues,
                    "total_price": str(batch.total_price),
                    "preview": ShipmentSerializer(
                        batch.shipments.all()[:5], many=True
                    ).data,
                },
                status=201,
            )

        except Exception as exc:
            logger.error(
                f"CSV processing failed for user {user.username} - batch creation aborted",
                exc_info=True,
            )
            if "batch" in locals():
                batch.delete()  # cleanup on failure
            return Response(
                {"error": "Failed to process CSV file", "detail": str(exc)}, status=500
            )


class BulkUpdateView(GenericAPIView):
    """Bulk update shipments in a batch"""

    permission_classes = [IsAuthenticated]
    serializer_class = None

    def post(self, request, batch_id):
        batch = get_object_or_404(Batch, id=batch_id, user=request.user)
        action = request.data.get("action")
        shipment_ids = request.data.get("shipment_ids", [])

        if not shipment_ids:
            return Response({"error": "No shipment IDs provided"}, status=400)

        logger.info(
            f"Bulk action '{action}' started by {request.user.username} "
            f"on batch {batch_id} for {len(shipment_ids)} shipments"
        )

        updated_count = 0

        if action == "change_address":
            address_id = request.data.get("address_id")
            address = get_object_or_404(Address, id=address_id, user=request.user)

            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(
                from_first_name=address.first_name,
                from_last_name=address.last_name,
                from_address_line1=address.address_line1,
                from_address_line2=address.address_line2,
                from_city=address.city,
                from_zip_code=address.zip_code,
                from_state=address.state,
                address=address,
            )

        elif action == "change_package":
            package_id = request.data.get("package_id")
            package = get_object_or_404(Package, id=package_id, user=request.user)

            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(
                length_inches=package.length_inches,
                width_inches=package.width_inches,
                height_inches=package.height_inches,
                weight_lbs=package.weight_lbs,
                weight_oz=package.weight_oz,
                item_sku=package.sku,
                package=package,
            )

        elif action == "change_service":
            service = request.data.get("service")
            if service not in dict(Shipment.SERVICE_CHOICES):
                return Response({"error": "Invalid shipping service"}, status=400)

            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(shipping_service=service)

            for shipment in batch.shipments.filter(id__in=shipment_ids):
                shipment.save(update_fields=["price"])

        else:
            return Response({"error": "Unknown bulk action"}, status=400)

        batch.calculate_total()

        logger.info(
            f"Bulk action '{action}' completed: {updated_count} shipments updated "
            f"- new batch total: ${batch.total_price}"
        )

        return Response(
            {
                "status": "success",
                "updated_count": updated_count,
                "new_total": str(batch.total_price),
            }
        )
