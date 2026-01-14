"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import type { ShipmentRecord } from "@/lib/schemas";

interface AddressOption {
  id: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
}

interface PackageOption {
  id: string;
  length_inches: number;
  width_inches: number;
  height_inches: number;
  weight_lbs: number;
  weight_oz: number;
  sku?: string;
}

interface BulkActionsModalProps {
  type: "address" | "package";
  selectedCount: number;
  records: ShipmentRecord[];
  selectedIds: Set<string>;
  batchId: string;
  onApply: (updates: any) => void;
  onClose: () => void;
}

export function BulkActionsModal({
  type,
  selectedCount,
  selectedIds,
  batchId,
  onApply,
  onClose,
}: BulkActionsModalProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");

  const { data: addressesData, isLoading: loadingAddresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: () =>
      axios.get("/api/addresses", { params: { saved: true } }).then((res) => res?.data?.data),
  });

  const { data: packagesData, isLoading: loadingPackages } = useQuery({
    queryKey: ["packages"],
    queryFn: () =>
      axios.get("/api/packages", { params: { saved: true } }).then((res) => res?.data?.data),
  });

  const addresses = addressesData?.results ?? [];
  const packages = packagesData?.results ?? [];

  // Find selected resource for preview
  const selectedAddress = addresses.find((a: AddressOption) => a.id === selectedResourceId);
  const selectedPackage = packages.find((p: PackageOption) => p.id === selectedResourceId);

  const handleApply = async () => {
    if (!selectedResourceId) {
      toast.error(`Please select a ${type}`);
      return;
    }

    const toastId = toast.loading(`Applying to ${selectedCount} record${selectedCount !== 1 ? "s" : ""}...`);

    try {
      const payload = {
        action: type === "address" ? "change_address" : "change_package",
        shipment_ids: Array.from(selectedIds),
        [type === "address" ? "address_id" : "package_id"]: selectedResourceId,
      };

      const res = await axios.post(`/api/batches/${batchId}/`, payload);

      toast.success(
        `Updated ${res.data.updated_count || selectedCount} record${selectedCount !== 1 ? "s" : ""}!`,
        { id: toastId }
      );

      onApply({});
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to apply changes", { id: toastId });
    }
  };

  const isLoading = loadingAddresses || loadingPackages;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">
            {type === "address" ? "Change Ship From Address" : "Change Package Details"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Applying to <strong>{selectedCount}</strong> selected record{selectedCount !== 1 ? "s" : ""}
          </p>

          {/* Selection Dropdown */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading saved {type}s...</div>
          ) : type === "address" ? (
            addresses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved addresses found. Please create one first.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Select Address</label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">— Choose an address —</option>
                  {addresses.map((addr: AddressOption) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.first_name} {addr.last_name} • {addr.address_line1}, {addr.city} {addr.state} {addr.zip_code}
                    </option>
                  ))}
                </select>
              </div>
            )
          ) : packages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No saved packages found. Please create one first.
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Select Package</label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">— Choose a package —</option>
                {packages.map((pkg: PackageOption) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.length_inches}×{pkg.width_inches}×{pkg.height_inches}" • {pkg.weight_lbs}lb {pkg.weight_oz}oz
                    {pkg.sku ? ` • ${pkg.sku}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preview Form - Read Only */}
          {selectedResourceId && !isLoading && (
            <div className="mt-8 border rounded-lg p-6 bg-muted/40">
              <h3 className="text-sm font-medium mb-4 text-muted-foreground">
                Preview of selected {type === "address" ? "address" : "package"}
              </h3>

              {type === "address" && selectedAddress ? (
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Name</div>
                    <div className="font-medium">
                      {selectedAddress.first_name} {selectedAddress.last_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Phone</div>
                    <div>{selectedAddress.phone || "—"}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground mb-1">Address</div>
                    <div>
                      {selectedAddress.address_line1}
                      {selectedAddress.address_line2 && (
                        <>
                          <br />
                          {selectedAddress.address_line2}
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">City</div>
                    <div>{selectedAddress.city}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">State</div>
                      <div>{selectedAddress.state}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">ZIP</div>
                      <div>{selectedAddress.zip_code}</div>
                    </div>
                  </div>
                </div>
              ) : type === "package" && selectedPackage ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dimensions</div>
                    <div className="font-medium">
                      {selectedPackage.length_inches} × {selectedPackage.width_inches} × {selectedPackage.height_inches}"
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Weight</div>
                    <div className="font-medium">
                      {selectedPackage.weight_lbs} lb {selectedPackage.weight_oz} oz
                    </div>
                  </div>
                  {selectedPackage.sku && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">SKU</div>
                      <div>{selectedPackage.sku}</div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={isLoading || !selectedResourceId}
            >
              Apply to {selectedCount} Record{selectedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}