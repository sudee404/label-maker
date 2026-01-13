from django_filters import rest_framework as filters
from .models import Batch, Shipment
from django.db.models import Q


class BatchFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Batch.STATUS_CHOICES)
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")
    min_total = filters.NumberFilter(field_name="total_price", lookup_expr="gte")
    max_total = filters.NumberFilter(field_name="total_price", lookup_expr="lte")

    class Meta:
        model = Batch
        fields = ["status", "name"]


class ShipmentFilter(filters.FilterSet):
    batch = filters.CharFilter(field_name="batch_id", lookup_expr="exact")
    status = filters.ChoiceFilter(choices=Shipment.STATUS_CHOICES)
    service = filters.ChoiceFilter(
        field_name="shipping_service", choices=Shipment.SERVICE_CHOICES
    )
    search = filters.CharFilter(
        method="filter_search", label="Search by order #, name or address"
    )
    

    class Meta:
        model = Shipment
        fields = [
            "status",
            "shipping_service",
            "order_no",
        ]

    def filter_search(self, queryset, name, value):
        if value:
            value = value.strip()
            queryset = queryset.filter(
                Q(order_no__icontains=value)
                | Q(ship_to__name__icontains=value)
                | Q(ship_to__first_name__icontains=value)
                | Q(ship_to__last_name__icontains=value)
                | Q(ship_to__address_line1__icontains=value)
                | Q(ship_to__address_line2__icontains=value)
                | Q(ship_to__city__icontains=value)
                | Q(ship_to__state__icontains=value)
            )
            
        return queryset
