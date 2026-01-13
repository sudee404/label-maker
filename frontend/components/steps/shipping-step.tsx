"use client";

import { useState, useMemo } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShipmentRecord } from "@/lib/schemas";

interface ShippingStepProps {
  records: ShipmentRecord[];
  onUpdate: (records: ShipmentRecord[]) => void;
  onContinue: () => void;
  onBack: () => void;
  selectedRows: Set<string>;
  onSelectRows: (rows: Set<string>) => void;
}

const shipping_services = [
  {
    id: "priority",
    name: "Priority Mail",
    basePrice: 5.0,
    description: "Faster delivery (2-3 days)",
  },
  {
    id: "ground",
    name: "Ground Shipping",
    basePrice: 2.5,
    description: "Economy option (5-7 days)",
  },
];

const ITEMS_PER_PAGE = 10;

function calculateprice(service: string, weight: number): number {
  const oz = (weight % 1) * 16;
  const totalOz = Math.floor(weight) * 16 + oz;

  if (service === "priority") {
    return 5.0 + totalOz * 0.1;
  } else {
    return 2.5 + totalOz * 0.05;
  }
}

export function ShippingStep({
  records,
  onUpdate,
  onContinue,
  onBack,
  selectedRows,
  onSelectRows,
}: ShippingStepProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.shipTo.first_name.toLowerCase().includes(searchLower) ||
        record.order_no.toLowerCase().includes(searchLower)
      );
    });
  }, [records, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalPrice = useMemo(() => {
    return records.reduce(
      (sum, record) => sum + (record.price || 0),
      0
    );
  }, [records]);

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRecords.length) {
      onSelectRows(new Set());
    } else {
      onSelectRows(new Set(paginatedRecords.map((r) => r.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectRows(newSelection);
  };

  const handleServiceChange = (recordId: string, service: string) => {
    const record = records.find((r) => r.id === recordId);
    if (record) {
      const weight = record.package.lbs + record.package.oz / 16;
      const price = calculateprice(service, weight);

      onUpdate(
        records.map((r) =>
          r.id === recordId
            ? { ...r, shipping_service: service, price: price }
            : r
        )
      );
      toast.success(
        `Updated shipping method to ${
          shipping_services.find((s) => s.id === service)?.name
        }`
      );
    }
  };

  const handleBulkServiceChange = (service: string) => {
    onUpdate(
      records.map((r: ShipmentRecord) => {
        if (selectedRows.has(r.id)) {
          const weight = r.package.lbs + r.package.oz / 16;
          const price = calculateprice(service, weight);
          return { ...r, shipping_service: service, price: price };
        }
        return r;
      })
    );
    onSelectRows(new Set());
    toast.success(
      `Updated ${selectedRows.size} shipments to ${
        shipping_services.find((s) => s.id === service)?.name
      }`
    );
  };

  const handleDeleteRecord = (id: string) => {
    toast(
      <div className="space-y-2 min-w-[320px]">
        <p className="font-medium">Delete this shipment?</p>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              onUpdate(records.filter((r) => r.id !== id));
              selectedRows.delete(id);
              toast.dismiss();
              toast.success("Shipment deleted successfully");
            }}
            className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </div>,

    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Select Shipping Provider
            </h1>
          </div>
          <p className="text-muted-foreground">
            Step 3 of 4 • Choose shipping service for each shipment • Page{" "}
            {currentPage} of {totalPages}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
          <p className="text-3xl font-bold text-primary">
            ${totalPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or order number..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
        />
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {selectedRows.size} record{selectedRows.size > 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="flex items-center gap-2">
            {shipping_services.map((service) => (
              <Button
                key={service.id}
                size="sm"
                variant="outline"
                onClick={() => handleBulkServiceChange(service.id)}
              >
                Change to {service.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === paginatedRecords.length &&
                      paginatedRecords.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-border cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Recipient
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Ship To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Order #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Shipping Service
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map((record, idx) => (
                <tr
                  key={record.id}
                  className={`border-b border-border transition-colors ${
                    idx % 2 === 1 ? "bg-muted/30" : ""
                  } ${selectedRows.has(record.id) ? "bg-primary/10" : ""}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(record.id)}
                      onChange={() => handleSelectRow(record.id)}
                      className="rounded border-border cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {record.shipTo.first_name} {record.shipTo.last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {record.shipTo.city}, {record.shipTo.state}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {record.order_no}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={record.shipping_service || "ground"}
                      onChange={(e) =>
                        handleServiceChange(record.id, e.target.value)
                      }
                      className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground cursor-pointer"
                    >
                      {shipping_services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-right text-primary">
                    ${(record.price || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} of{" "}
          {filteredRecords.length} shipments
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button className="bg-primary hover:bg-primary/90" onClick={onContinue}>
          Continue to Purchase
        </Button>
      </div>
    </div>
  );
}
