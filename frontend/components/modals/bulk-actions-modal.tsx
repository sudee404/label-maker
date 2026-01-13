"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import type { ShipmentRecord } from "@/lib/schemas";
import { useQuery } from "@tanstack/react-query";

interface AddressOption {
  id: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
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
  batchId: string; // ← You need to pass this from parent!
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
  const { data: { data: addresses = [] } = {}, isLoading: loadingAddresses } =
    useQuery({
      queryKey: ["addresses"],
      queryFn: async () =>
        await axios
          .get("/api/addresses", { params: { saved: true } })
          .then((res) => res?.data),
    });

  const { data: { data: packages = [] } = {}, isLoading: loadingPackages } =
    useQuery({
      queryKey: ["packages"],
      queryFn: async () =>
        await axios
          .get("/api/packages", { params: { saved: true } })
          .then((res) => res?.data),
    });

  const handleApply = async () => {
    if (!selectedResourceId) {
      toast.error(
        `Please select a ${type === "address" ? "address" : "package"}`
      );
      return;
    }

    const toastId = toast.loading(
      `Applying to ${selectedCount} record${selectedCount !== 1 ? "s" : ""}...`
    );

    try {
      const payload = {
        action: type === "address" ? "change_address" : "change_package",
        shipment_ids: Array.from(selectedIds),
        [type === "address" ? "address_id" : "package_id"]: selectedResourceId,
      };

      const res = await axios.post(`/api/batches/${batchId}/`, payload); // adjust URL if needed

      toast.success(
        `Updated ${res.data.updated_count || selectedCount} record${
          selectedCount !== 1 ? "s" : ""
        }!`,
        { id: toastId }
      );

      onApply({});
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to apply changes", {
        id: toastId,
      });
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold">
            {type === "address"
              ? "Change Ship From Address"
              : "Change Package Details"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            Apply to <strong>{selectedCount}</strong> selected record
            {selectedCount !== 1 ? "s" : ""}
          </p>

          {loadingAddresses || loadingPackages ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading options...
            </div>
          ) : (
            <>
              {type === "address" ? (
                addresses?.results?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No saved addresses found. Please create one first.
                  </div>
                ) : (
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                    className="w-full px-3 py-2 border rounded bg-muted"
                  >
                    {addresses?.results?.map((addr: AddressOption) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.first_name} {addr.last_name} •{" "}
                        {addr.address_line1}, {addr.city} {addr.state}{" "}
                        {addr.zip_code}
                      </option>
                    ))}
                  </select>
                )
              ) : packages?.results?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No saved packages found. Please create one first.
                </div>
              ) : (
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 border rounded bg-muted"
                >
                  {packages?.results?.map((pkg: PackageOption) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.length_inches}×{pkg.width_inches}×{pkg.height_inches}
                      " • {pkg.weight_lbs}lb {pkg.weight_oz}oz
                      {pkg.sku ? ` • SKU: ${pkg.sku}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}

          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleApply}
              disabled={loadingAddresses || loadingPackages || !selectedResourceId}
            >
              Apply to {selectedCount} Record{selectedCount !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
