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
            email="test@example.com", password="testpass123"
        )
        self.client.force_authenticate(user=self.user)

        # Create sample saved address & package
        self.address = Address.objects.create(
            user=self.user,
            name="Main Office",
            first_name="Test",
            last_name="User",
            address_line1="123 Test St",
            city="Nairobi",
            state="NA",  # Use appropriate state code
            zip_code="00100",
            phone="+254712345678",
        )

        self.package = Package.objects.create(
            user=self.user,
            name="Small Parcel",
            length_inches=10.00,
            width_inches=8.00,
            height_inches=6.00,
            weight_lbs=2,
            weight_oz=4,
            sku="SMALL-PARCEL-001",
        )


class CSVUploadTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.url = reverse("csv-upload")

    def create_sample_csv(self, content):
        """Helper to create temp CSV file"""
        path = "/tmp/test_upload.csv"
        with open(path, "w") as f:
            f.write(content)
        return path

    def test_successful_csv_upload(self):
        csv_content = """From,,,,,,,To,,,,,,,weight*,weight*,Dimensions*,Dimensions*,Dimensions*,,,,
First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,lbs,oz,Length,width,Height,phone num1,phone num2,order no,Item-sku
,,,,,,,John,Doe,123 Main St,,Nairobi,00100,NA,,,,,,,,,ORD001,ITEM001
"""
        file_path = self.create_sample_csv(csv_content)

        with open(file_path, "rb") as f:
            response = self.client.post(self.url, {"file": f}, format="multipart")

        os.remove(file_path)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("batch_id", response.data)
        self.assertEqual(response.data["total_records"], 1)
        self.assertEqual(Batch.objects.count(), 1)
        self.assertEqual(Shipment.objects.count(), 1)

        shipment = Shipment.objects.first()
        self.assertEqual(shipment.to_first_name, "John")
        self.assertEqual(shipment.to_last_name, "Doe")
        self.assertEqual(shipment.status, "incomplete")  # missing weight

    def test_invalid_file_type(self):
        response = self.client.post(
            self.url,
            {"file": open(__file__, "rb")},  # Python file, not CSV
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only .csv", str(response.data))

    def test_no_file_provided(self):
        response = self.client.post(self.url, {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class BatchAndShipmentTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(user=self.user, name="Test Batch")
        Shipment.objects.create(
            batch=self.batch,
            to_first_name="Alice",
            to_last_name="Smith",
            to_address_line1="456 Test Ave",
            to_city="Mombasa",
            to_zip_code="80100",
            to_state="CO",
            weight_lbs=5,
            weight_oz=0,
            shipping_service="priority",
        )

    def test_list_batches(self):
        url = reverse("batch-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_retrieve_batch_with_shipments(self):
        url = reverse("batch-detail", kwargs={"pk": self.batch.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["shipments"]), 1)
        self.assertEqual(response.data["shipments"][0]["to_first_name"], "Alice")


class BulkUpdateTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(user=self.user)
        self.shipment1 = Shipment.objects.create(
            batch=self.batch, to_first_name="Test1"
        )
        self.shipment2 = Shipment.objects.create(
            batch=self.batch, to_first_name="Test2"
        )

        self.url = reverse("bulk-update", kwargs={"batch_id": self.batch.pk})

    def test_bulk_change_address(self):
        data = {
            "action": "change_address",
            "shipment_ids": [self.shipment1.pk, self.shipment2.pk],
            "address_id": self.address.pk,
        }
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["updated_count"], 2)

        self.shipment1.refresh_from_db()
        self.assertEqual(self.shipment1.from_address_line1, "123 Test St")
        self.assertEqual(self.shipment1.address.pk, self.address.pk)

    def test_bulk_change_service(self):
        data = {
            "action": "change_service",
            "shipment_ids": [self.shipment1.pk],
            "service": "ground",
        }
        response = self.client.post(self.url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment1.refresh_from_db()
        self.assertEqual(self.shipment1.shipping_service, "ground")
        self.assertEqual(self.shipment1.price, Decimal("2.50"))  # base price

    def test_invalid_action(self):
        data = {"action": "invalid_action", "shipment_ids": [self.shipment1.pk]}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PurchaseTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.batch = Batch.objects.create(
            user=self.user, status="shipping_selected", total_price=Decimal("12.50")
        )

    def test_successful_purchase(self):
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


class FilteringAndPaginationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()

        # Create multiple batches
        self.batch1 = Batch.objects.create(
            user=self.user, name="Batch January", status="uploaded", total_price=45.50
        )
        self.batch2 = Batch.objects.create(
            user=self.user,
            name="Batch February",
            status="purchased",
            total_price=120.00,
        )

        # Create shipments in batch1
        Shipment.objects.bulk_create(
            [
                Shipment(
                    batch=self.batch1,
                    order_no="ORD001",
                    to_city="Nairobi",
                    to_state="NA",
                    status="valid",
                ),
                Shipment(
                    batch=self.batch1,
                    order_no="ORD002",
                    to_city="Mombasa",
                    to_state="CO",
                    status="incomplete",
                ),
                Shipment(
                    batch=self.batch1,
                    order_no="ORD003",
                    to_city="Kisumu",
                    to_state="NY",
                    status="valid",
                ),
            ]
        )

    def test_batch_status_filter(self):
        url = reverse("batch-list")
        response = self.client.get(url, {"status": "purchased"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "Batch February")

    def test_shipment_batch_filter(self):
        url = reverse("shipment-list")
        response = self.client.get(url, {"batch_id": str(self.batch1.pk)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 3)

    def test_shipment_search_and_ordering(self):
        url = reverse("shipment-list")
        response = self.client.get(url, {"search": "ORD00", "ordering": "-order_no"})
        self.assertEqual(response.status_code, 200)
        results = response.data["results"]
        self.assertEqual(results[0]["order_no"], "ORD003")

    def test_pagination_works(self):        

        url = reverse('shipment-list')

        response = self.client.get(url, {'page_size': 2, 'page': 1})
        data = response.data

        self.assertEqual(data['count'], 3)
        self.assertEqual(data['current'], 1)
        self.assertEqual(data['total_pages'], 2)
        self.assertTrue(data['has_next'])
        self.assertEqual(data['has_previous'],False)
        self.assertEqual(len(data['results']), 2)

        # Last page check
        response_last = self.client.get(url, {'page_size': 2, 'page': 2})
        self.assertEqual(response_last.data['total_pages'], 2)
        self.assertEqual(len(response_last.data['results']), 1)
        self.assertFalse(response_last.data['has_next'])