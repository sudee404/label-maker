from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register(r'packages', views.PackageViewSet, basename='package')
router.register(r'batches', views.BatchViewSet, basename='batch')
router.register(r'shipments', views.ShipmentViewSet, basename='shipment')

urlpatterns = [
    path('', include(router.urls)),
    path('upload/', views.CSVUploadView.as_view(), name='csv-upload'),
    path('batches/<uuid:batch_id>/bulk-update/', views.BulkUpdateView.as_view(), name='bulk-update'),
]