"use client";

import { useState, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { ShipmentRecord } from "@/lib/schemas";
import axios from "axios";
import { ShipmentFilter } from "@/app/(protected)/(dashboard)/upload";

interface ShippingStepProps {
  records: ShipmentRecord[];
  data: {
    current: number;
    total_pages: number;
    total_prices: any;
    count: number;
  };
  batch: string | null | undefined;
  loading: boolean;
  onUpdate: () => void;
  onContinue: () => void;
  onBack: () => void;
  filter: ShipmentFilter;
  setFilter: (filter: any) => void;
  selectedRows: Set<string>;
  onSelectRows: (rows: Set<string>) => void;
}

const shipping_services = [
  {
    id: "priority",
    name: "Priority Mail",
    description: "Faster delivery (2-3 days)",
  },
  {
    id: "ground",
    name: "Ground Shipping",
    description: "Economy option (5-7 days)",
  },
];

export function ShippingStep({
  records,
  data,
  batch,
  loading,
  filter,
  setFilter,
  onUpdate,
  onContinue,
  onBack,
  selectedRows,
  onSelectRows,
}: ShippingStepProps) {
  const [searchInput, setSearchInput] = useState(filter.search || "");

  const handleSelectAllOnPage = (checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      records?.forEach((r) => newSelection.add(r.id));
    } else {
      records?.forEach((r) => newSelection.delete(r.id));
    }
    onSelectRows(newSelection);
  };

  const handleServiceChange = async (recordId: string, service: string) => {
    const record = records?.find((r) => r.id === recordId);
    if (record) {
      try {
        await axios.patch(`/api/shipments/${recordId}`, {
          shipping_service: service,
        });

        onUpdate();
        toast.success(
          `Updated shipping method to ${
            shipping_services.find((s) => s.id === service)?.name
          }`
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to update shipping service");
      }
    }
  };

  const handleBulkServiceChange = async (service: string) => {
    const count = selectedRows.size;
    if (count === 0) return;

    const loadingToast = toast.loading(
      `Updating ${count} shipment${count !== 1 ? "s" : ""}...`
    );

    try {
      const updatePromises = Array.from(selectedRows).map((id) => {
        const record = records?.find((r) => r.id === id);
        if (!record) return Promise.resolve();

        return axios.patch(`/api/shipments/${id}`, {
          shipping_service: service,
        });
      });

      const results = await Promise.allSettled(updatePromises);

      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      const failedCount = results.length - successCount;

      if (failedCount === 0) {
        toast.success(
          `Successfully updated ${successCount} shipment${
            successCount !== 1 ? "s" : ""
          } to ${shipping_services.find((s) => s.id === service)?.name}`,
          { id: loadingToast }
        );
        onUpdate();
        onSelectRows(new Set());
      } else {
        toast.warning(`${successCount} updated, ${failedCount} failed`, {
          id: loadingToast,
        });
        onUpdate();
      }
    } catch (err) {
      console.error("Bulk update error:", err);
      toast.error("Failed to update selected shipments", {
        id: loadingToast,
      });
    }
  };

  const handleDeleteRecord = (id: string) => {
    toast(
      <div className="space-y-2">
        <p className="font-medium">Delete this shipment?</p>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              await axios
                .delete(`/api/shipments/${id}`)
                .then(() => {
                  onUpdate();
                  const newSelection = new Set(selectedRows);
                  newSelection.delete(id);
                  onSelectRows(newSelection);
                  toast.dismiss();
                  toast.success("Shipment deleted successfully");
                })
                .catch((err) => {
                  console.log(err);
                  toast.error("Error deleting shipment");
                });
            }}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const handleSort = (columnId: string) => {
    const isCurrentSort = filter.sortBy === columnId;
    const newOrder =
      isCurrentSort && filter.sortDirection === "asc" ? "desc" : "asc";

    setFilter({
      ...filter,
      sortBy: columnId,
      sortDirection: newOrder,
      page: 1,
    });
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
    const timeoutId = setTimeout(() => {
      setFilter({
        ...filter,
        search: value,
        page: 1,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const columns: ColumnDef<ShipmentRecord>[] = [
    {
      id: "select",
      header: () => {
        const allOnPageSelected =
          records?.length > 0 && records?.every((r) => selectedRows.has(r.id));

        return (
          <Checkbox
            checked={allOnPageSelected}
            onCheckedChange={(checked) => handleSelectAllOnPage(!!checked)}
            aria-label="Select all on page"
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRows.has(row.original.id)}
          onCheckedChange={(checked) => {
            const newSelection = new Set(selectedRows);
            if (checked) {
              newSelection.add(row.original.id);
            } else {
              newSelection.delete(row.original.id);
            }
            onSelectRows(newSelection);
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "ship_to",
      header: () => {
        const isSorted = filter.sortBy === "ship_to__name";
        return (
          <Button
            variant="ghost"
            onClick={() => handleSort("ship_to__name")}
            className="h-8 px-2"
          >
            Recipient{" "}
            <ArrowUpDown
              className={`ml-2 h-4 w-4 ${isSorted ? "text-primary" : ""}`}
            />
          </Button>
        );
      },
      cell: ({ row }) => {
        const shipTo = row.original.ship_to;
        return (
          <div>
            <div className="font-medium">
              {shipTo?.first_name} {shipTo?.last_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {shipTo?.city}, {shipTo?.state}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "order_no",
      header: "Order #",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.order_no}</div>
      ),
    },
    {
      accessorKey: "package",
      header: "Package",
      cell: ({ row }) => {
        const pkg = row.original.package;
        return (
          <div className="text-sm text-muted-foreground">
            {pkg?.length_inches}×{pkg?.width_inches}×{pkg?.height_inches}" •{" "}
            {pkg?.weight_lbs}lb {pkg?.weight_oz}oz
          </div>
        );
      },
    },
    {
      accessorKey: "shipping_service",
      header: "Shipping Service",
      cell: ({ row }) => {
        return (
          <select
            value={row.original.shipping_service || "ground"}
            onChange={(e) =>
              handleServiceChange(row.original.id, e.target.value)
            }
            className="bg-background border border-input rounded-md px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
          >
            {shipping_services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Price</div>,
      cell: ({ row }) => {
        return (
          <div className="text-right font-semibold text-primary">
            ${parseFloat(row?.original?.price as any)?.toFixed(2)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteRecord(row.original.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.total_pages,
    state: {
      pagination: {
        pageIndex: data?.current - 1,
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h1 className="text-2xl font-bold">Select Shipping Provider</h1>
          </div>
          <p className="text-muted-foreground">
            Step 3 of 4 • {data?.count} shipments • Page {data?.current} of{" "}
            {data?.total_pages}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
          <p className="text-3xl font-bold text-primary">
            ${parseFloat(data?.total_prices ?? 0.0)?.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or order number..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedRows.size} shipment{selectedRows.size > 1 ? "s" : ""}{" "}
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
      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b transition-colors hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {loading ? (
              <tr className="border-b transition-colors hover:bg-muted/50">
                <td
                  colSpan={columns.length}
                  className="p-4 align-middle h-24 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b transition-colors hover:bg-muted/50 ${
                    selectedRows.has(row.original.id) ? "bg-primary/5" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="border-b transition-colors hover:bg-muted/50">
                <td
                  colSpan={columns.length}
                  className="p-4 align-middle h-24 text-center"
                >
                  No shipments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(data.current - 1) * 10 + 1} to{" "}
          {Math.min(data.current * 10, data.count)} of {data.count} records
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter({ ...filter, page: filter.page - 1 })}
            disabled={data.current === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium px-2">
            Page {data.current} of {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilter({ ...filter, page: filter.page + 1 })}
            disabled={data.current === data.total_pages || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button
          onClick={onContinue}
          disabled={loading || records?.length === 0}
        >
          Continue to Purchase
        </Button>
      </div>
    </div>
  );
}
