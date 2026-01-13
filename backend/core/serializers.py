from rest_framework import serializers
from .models import Batch, Shipment, Address, Package


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'


class PackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = '__all__'


class ShipmentSerializer(serializers.ModelSerializer):
    address = AddressSerializer(read_only=True)
    package = PackageSerializer(read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['batch', 'price', 'status', 'created_at']


class BatchSerializer(serializers.ModelSerializer):
    shipments = ShipmentSerializer(many=True, read_only=True)

    class Meta:
        model = Batch
        fields = '__all__'