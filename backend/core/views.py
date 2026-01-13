import csv
import io
import logging
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView
from django.shortcuts import get_object_or_404
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
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]


class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.all()
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
        return Batch.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def purchase(self, request, pk=None):
        batch = self.get_object()
        logger.info(
            f"User {request.user.username} purchasing batch {batch.id} (total: ${batch.total_price})"
        )

        if batch.status == "purchased":
            return Response({"detail": "Batch already purchased"}, status=400)

        batch.status = "purchased"
        batch.label_format = request.data.get("label_format")
        batch.save(update_fields=["status", "label_format", "updated_at"])

        logger.info(
            f"Batch {batch.id} purchased successfully by {request.user.username}"
        )
        return Response(BatchSerializer(batch).data)


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ShipmentFilter
    search_fields = ["order_no", "ship_to__city", "ship_to__state"]
    ordering_fields = ["created_at", "price"]

    def get_queryset(self):
        queryset = Shipment.objects.all()
        batch_id = self.request.query_params.get("batch_id")
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset.filter(batch__user=self.request.user)


class CSVUploadView(GenericAPIView):
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        file_obj = request.FILES.get("file")

        if not file_obj:
            logger.warning(f"No file provided by {user.username}")
            return Response({"error": "No file provided"}, status=400)

        if not file_obj.name.lower().endswith(".csv"):
            logger.warning(f"Invalid file type by {user.username}: {file_obj.name}")
            return Response({"error": "Only .csv files allowed"}, status=400)

        try:
            file_data = file_obj.read().decode("utf-8-sig")
            csv_reader = csv.reader(io.StringIO(file_data))
            rows = list(csv_reader)
            data_rows = rows[2:]  # skip headers

            if not data_rows:
                return Response({"error": "CSV is empty"}, status=400)

            if len(data_rows) > 500:
                return Response({"error": "Max 500 rows allowed"}, status=400)

            batch = Batch.objects.create(
                user=user, name=f"Upload - {file_obj.name} ({len(data_rows)} items)"
            )
            logger.info(
                f"{user.username} created batch {batch.id} with {len(data_rows)} rows"
            )

            created = 0
            issues = 0

            for row in data_rows:
                if len(row) < 23 or not row[9].strip():  # to_address_line1 required
                    issues += 1
                    continue
                print(row)
                # Create Ship From Address (only if meaningful data exists)
                ship_from = None
                if row[2].strip():  # from_address_line1 present
                    ship_from, _ = Address.objects.get_or_create(
                        address_line1=row[2].strip(),
                        city=row[4].strip(),
                        state=row[6].strip(),
                        zip_code=row[5].strip(),
                        defaults={
                            "name": f"From {row[0].strip()} {row[1].strip()}",
                            "first_name": row[0].strip(),
                            "last_name": row[1].strip(),
                            "address_line2": row[3].strip(),
                            "phone": row[19].strip(),
                        },
                    )

                # Create Ship To Address (required)
                ship_to, _ = Address.objects.get_or_create(
                    address_line1=row[9].strip(),
                    city=row[11].strip(),
                    state=row[13].strip(),
                    zip_code=row[12].strip(),
                    defaults={
                        "name": f"To {row[7].strip()} {row[8].strip()}",
                        "first_name": row[7].strip(),
                        "last_name": row[8].strip(),
                        "address_line2": row[10].strip(),
                        "phone": row[19].strip(),
                    },
                )

                # Create or match Package (for now create new)
                package, _ = Package.objects.get_or_create(
                    length_inches=float(row[16]) if row[16].strip() else None,
                    width_inches=float(row[17]) if row[17].strip() else None,
                    height_inches=float(row[18]) if row[18].strip() else None,
                    weight_lbs=int(row[14]) if row[14].strip().isdigit() else 0,
                    weight_oz=int(row[15]) if row[15].strip().isdigit() else 0,
                    sku=row[22].strip(),
                    defaults={"name": f"Package for {row[21]}", "saved": False},
                )

                shipment = Shipment.objects.create(
                    batch=batch,
                    ship_from=ship_from,
                    ship_to=ship_to,
                    package=package,
                    order_no=row[21].strip(),
                )

                # Validate
                if not shipment.ship_to or (
                    shipment.package.weight_lbs + shipment.package.weight_oz == 0
                ):
                    shipment.status = "incomplete"
                    shipment.save(update_fields=["status"])

                created += 1

            batch.calculate_total()
            logger.info(f"Batch {batch.id} success: {created} created, {issues} issues")

            return Response(
                {
                    "batch_id": str(batch.id),
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
            logger.error(f"CSV failed for {user.username}: {str(exc)}", exc_info=True)
            if "batch" in locals():
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

        if not shipment_ids:
            return Response({"error": "No shipment IDs"}, status=400)

        logger.info(f"Bulk {action} by {request.user.username} on batch {batch_id}")

        updated_count = 0

        if action == "change_address":
            address_id = request.data.get("address_id")
            address = get_object_or_404(Address, id=address_id, user=request.user)
            # Apply to both from and to (or only from - adjust as needed)
            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(ship_from=address)

        elif action == "change_package":
            package_id = request.data.get("package_id")
            package = get_object_or_404(Package, id=package_id, user=request.user)
            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(package=package)
            # Recalculate prices
            for s in batch.shipments.filter(id__in=shipment_ids):
                s.save(update_fields=["price"])

        elif action == "change_service":
            service = request.data.get("service")
            if service not in dict(Shipment.SERVICE_CHOICES):
                return Response({"error": "Invalid service"}, status=400)
            updated_count = Shipment.objects.filter(
                batch=batch, id__in=shipment_ids
            ).update(shipping_service=service)
            for s in batch.shipments.filter(id__in=shipment_ids):
                s.save(update_fields=["price"])

        else:
            return Response({"error": "Unknown action"}, status=400)

        batch.calculate_total()
        logger.info(
            f"Bulk {action} done: {updated_count} updated, total ${batch.total_price}"
        )

        return Response(
            {
                "status": "success",
                "updated_count": updated_count,
                "new_total": str(batch.total_price),
            }
        )
