from django_filters import rest_framework as filters
from .models import Batch, Shipment


class BatchFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Batch.STATUS_CHOICES)
    created_after = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    min_total = filters.NumberFilter(field_name='total_price', lookup_expr='gte')
    max_total = filters.NumberFilter(field_name='total_price', lookup_expr='lte')

    class Meta:
        model = Batch
        fields = ['status', 'name']


class ShipmentFilter(filters.FilterSet):
    batch = filters.CharFilter(field_name='batch_id', lookup_expr='exact')
    status = filters.ChoiceFilter(choices=Shipment.STATUS_CHOICES)
    service = filters.ChoiceFilter(field_name='shipping_service', choices=Shipment.SERVICE_CHOICES)
    order_no = filters.CharFilter(lookup_expr='icontains')
    min_weight = filters.NumberFilter(field_name='weight_lbs', lookup_expr='gte')
    to_city = filters.CharFilter(field_name='ship_to__city', lookup_expr='icontains')
    to_state = filters.CharFilter(field_name='ship_to__state', lookup_expr='exact')
    to_zip_code = filters.CharFilter(field_name='ship_to__zip_code', lookup_expr='exact')

    class Meta:
        model = Shipment
        fields = [
            'status', 'shipping_service', 'order_no',
            'to_city', 'to_state', 'to_zip_code'
        ]