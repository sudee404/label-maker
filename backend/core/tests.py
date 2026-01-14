from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from decimal import Decimal
import os

from .models import Batch, Shipment, Address, Package

User = get_user_model()


class BaseAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

        # Common test data
        self.address = Address.objects.create(
            name="Test Warehouse",
            first_name="Warehouse",
            last_name="Team",
            address_line1="123 Industrial Way",
            city="Nairobi",
            state="NA",
            zip_code="00100",
            phone="+254700000000",
            saved=True,
        )

        self.package = Package.objects.create(
            name="Medium Box",
            length_inches=Decimal("12.00"),
            width_inches=Decimal("10.00"),
            height_inches=Decimal("8.00"),
            weight_lbs=3,
            weight_oz=8,
            sku="MED-BOX-001",
            saved=True,
        )


class CSVUploadTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("csv-upload")  # Confirm this matches your URL conf

    def create_temp_csv(self, content):
        path = "/tmp/test_shipments.csv"
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return path

    def test_successful_minimal_csv_upload(self):
        # Adjusted CSV to match parser: skip first 2 rows, row[7:]=first_name_to, row[8]=last_name_to,
        # row[9]=line1 (required), row[11]=city, row[12]=zip, row[13]=state
        # row[14]=lbs, [15]=oz, [16..18]=dims, [19]=phone1, [20]=phone2, [21]=order_no, [22]=sku
        csv_content = """dummy_header1,dummy_header2
dummy_row_skip1,dummy
,,,,,,,John,Doe,Test Street 123,,Nairobi,00100,NA,2,8,12,10,8,+254712345678,,ORD-TEST001,SKU123
"""
        file_path = self.create_temp_csv(csv_content)

        with open(file_path, "rb") as csv_file:
            response = self.client.post(
                self.url,
                {"file": csv_file},
                format="multipart"
            )

        os.remove(file_path)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn("batch_id", response.data)
        self.assertEqual(response.data["total_records"], 1)
        self.assertEqual(response.data["issues"], 0)

        shipment = Shipment.objects.first()
        self.assertIsNotNone(shipment)
        self.assertEqual(shipment.order_no, "ORD-TEST001")
        self.assertEqual(shipment.ship_to.first_name, "John")
        self.assertEqual(shipment.ship_to.last_name, "Doe")
        self.assertEqual(shipment.ship_to.address_line1, "Test Street 123")
        self.assertEqual(shipment.ship_to.city, "Nairobi")
        self.assertEqual(shipment.ship_to.state, "NA")
        self.assertEqual(shipment.ship_to.zip_code, "00100")
        self.assertEqual(shipment.package.weight_lbs, 2)
        self.assertEqual(shipment.package.weight_oz, 8)
        self.assertEqual(shipment.package.length_inches, Decimal("12.00"))
        self.assertIsNotNone(shipment.package_id)

    def test_invalid_file_type(self):
        with open(__file__, "rb") as py_file:
            response = self.client.post(
                self.url,
                {"file": py_file},
                format="multipart"
            )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only .csv", str(response.data))

    def test_no_file(self):
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class BatchViewSetTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(
            user=self.user,
            name="API Test Batch",
            status="reviewed"
        )
        self.shipment = Shipment.objects.create(
            batch=self.batch,
            ship_to=self.address,
            package=self.package,
            order_no="TEST-ORD-001",
            shipping_service="priority"
        )
        self.shipment.calculate_price()
        self.shipment.save(update_fields=["price"])

    def test_list_batches(self):
        url = reverse("batch-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_batch(self):
        url = reverse("batch-detail", kwargs={"pk": self.batch.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "API Test Batch")
        self.assertEqual(len(response.data["shipments"]), 1)

    def test_purchase_batch_success(self):
        self.batch.status = "shipping_selected"
        self.batch.save()

        url = reverse("batch-purchase", kwargs={"pk": self.batch.pk})
        response = self.client.post(url, {"label_format": "4x6"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.status, "purchased")
        self.assertEqual(self.batch.label_format, "4x6")

    def test_cannot_purchase_already_purchased(self):
        self.batch.status = "purchased"
        self.batch.save()

        url = reverse("batch-purchase", kwargs={"pk": self.batch.pk})
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already purchased", str(response.data).lower())


class BulkUpdateTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(user=self.user, name="Bulk Test")
        
        self.shipment1 = Shipment.objects.create(
            batch=self.batch, 
            ship_from=self.address,
            ship_to=self.address,
            package=self.package,
            order_no="BULK-001"
        )
        self.shipment1.calculate_price()
        self.shipment1.save(update_fields=["price"])

        self.shipment2 = Shipment.objects.create(
            batch=self.batch, 
            order_no="BULK-002"
        )

        self.bulk_url = reverse("bulk-update", kwargs={"batch_id": self.batch.pk})

    def test_bulk_change_address(self):
        data = {
            "action": "change_address",
            "shipment_ids": [self.shipment1.pk, self.shipment2.pk],
            "address_id": self.address.pk
        }
        response = self.client.post(self.bulk_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated_count"], 2)

        self.shipment2.refresh_from_db()
        self.assertEqual(self.shipment2.ship_from_id, self.address.pk)

    def test_bulk_change_service_and_price_update(self):
        data = {
            "action": "change_service",
            "shipment_ids": [self.shipment1.pk],
            "service": "priority"
        }
        response = self.client.post(self.bulk_url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.shipment1.refresh_from_db()
        self.assertEqual(self.shipment1.shipping_service, "priority")
        self.assertGreater(self.shipment1.price, Decimal("0.00"))


class ShipmentViewSetTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(user=self.user)
        self.shipment = Shipment.objects.create(
            batch=self.batch,
            ship_to=self.address,
            package=self.package,
            order_no="SHIP-TEST-777",
            shipping_service="ground"
        )
        self.shipment.calculate_price()
        self.shipment.save(update_fields=["price"])

    def test_list_shipments_with_total_price(self):
        url = reverse("shipment-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_prices", response.data)


class ModelValidationTests(TestCase):
    def test_package_validation_zero_weight(self):
        package = Package.objects.create(
            name="Zero Weight",
            length_inches=10,
            width_inches=10,
            height_inches=10,
            weight_lbs=0,
            weight_oz=0
        )
        shipment = Shipment(package=package)
        is_valid, msg = shipment.validate_package()
        self.assertFalse(is_valid)
        self.assertIn("greater than 0", msg)

    def test_address_validation_missing_fields(self):
        addr = Address(
            name="Incomplete",
            address_line1="Street",
            city="City",
            # missing state & zip
        )
        shipment = Shipment()
        is_valid, msg = shipment.validate_address(addr, "sender")
        self.assertFalse(is_valid)
        self.assertIn("state", msg)
        self.assertIn("zip code", msg)