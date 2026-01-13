"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Edit2,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsModal } from "@/components/modals/bulk-actions-modal";
import { EditRecordModal } from "@/components/modals/edit-record-modal";
import { toast } from "sonner";
import type { ShipmentRecord } from "@/lib/schemas";
import { ShipmentFilter } from "@/app/(protected)/upload/page";
import axios from "axios";

interface ReviewStepProps {
  records: ShipmentRecord[];
  data: {
    current: number;
    total_pages: number;
    count: number;
  };
  batch: String | null | undefined;
  loading: boolean;
  onUpdate: () => void;
  onContinue: () => void;
  filter: ShipmentFilter;
  setFilter: (filter: any) => void;
  onBack: () => void;
  selectedRows: Set<string>;
  onSelectRows: (rows: Set<string>) => void;
}

export function ReviewStep({
  records,
  data,
  batch,
  loading,
  onUpdate,
  filter,
  setFilter,
  onContinue,
  onBack,
  selectedRows,
  onSelectRows,
}: ReviewStepProps) {
  const [editingRecord, setEditingRecord] = useState<ShipmentRecord | null>(
    null
  );
  const [bulkActionType, setBulkActionType] = useState<
    "address" | "package" | null
  >(null);
  const [searchInput, setSearchInput] = useState(filter.search || "");

  const handleDeleteRecord = (id: string) => {
    toast(
      <div className="space-y-2">
        <p className="font-medium">Delete this record?</p>
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
                  toast.success("Record deleted successfully");
                })
                .catch((err) => {
                  console.log(err);
                  toast.error("Error deleting ");
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

  const handleEditSave = () => {
    onUpdate();
    setEditingRecord(null);
    toast.success("Record updated successfully");
  };

  const handleBulkDelete = () => {
    const count = selectedRows.size;
    if (count === 0) return;

    toast(
      <div className="space-y-2">
        <p className="font-medium">Delete {selectedRows.size} record(s)?</p>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss();

              const loadingToast = toast.loading(
                `Deleting ${count} record${count !== 1 ? "s" : ""}...`
              );

              try {
                const deletePromises = Array.from(selectedRows).map((id) =>
                  axios.delete(`/api/shipments/${id}`)
                );

                const results = await Promise.allSettled(deletePromises);

                const successCount = results.filter(
                  (r) => r.status === "fulfilled"
                ).length;
                const failedCount = results.length - successCount;

                if (failedCount === 0) {
                  toast.success(
                    `Successfully deleted ${successCount} record${
                      successCount !== 1 ? "s" : ""
                    }`,
                    { id: loadingToast }
                  );
                  onUpdate();
                  onSelectRows(new Set());
                } else {
                  toast.warning(
                    `${successCount} deleted, ${failedCount} failed`,
                    { id: loadingToast }
                  );
                  onUpdate();
                }
              } catch (err) {
                console.error("Bulk delete error:", err);
                toast.error("Failed to delete selected records", {
                  id: loadingToast,
                });
              }
            }}
            className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Delete All
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

  const handleSelectAllOnPage = (checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      records?.forEach((r) => newSelection.add(r.id));
    } else {
      records?.forEach((r) => newSelection.delete(r.id));
    }
    onSelectRows(newSelection);
  };

  const columns: ColumnDef<ShipmentRecord>[] = [
    {
      id: "select",
      header: () => {
        const allOnPageSelected =
          records?.length > 0 && records.every((r) => selectedRows.has(r.id));

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
      accessorKey: "ship_from",
      header: () => {
        const isSorted = filter.sortBy === "ship_from__name";
        return (
          <Button
            variant="ghost"
            onClick={() => handleSort("ship_from__name")}
            className="h-8 px-2"
          >
            Ship From
            <ArrowUpDown
              className={`ml-2 h-4 w-4 ${isSorted ? "text-primary" : ""}`}
            />
          </Button>
        );
      },
      cell: ({ row }) => {
        const shipFrom = row.original.ship_from;
        return (
          <div>
            <div className="font-medium">
              {shipFrom?.first_name} {shipFrom?.last_name}
            </div>
            <div className="text-xs text-muted-foreground">
              {shipFrom?.city}, {shipFrom?.state}
            </div>
          </div>
        );
      },
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
            Ship To
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
              {shipTo?.address_line1}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "package",
      header: "Package",
      cell: ({ row }) => {
        const pkg = row.original.package;
        return (
          <div className="text-sm text-muted-foreground">
            {pkg?.length_inches}x{pkg?.width_inches}x{pkg?.height_inches}" •{" "}
            {pkg?.weight_lbs}lb {pkg?.weight_oz}oz
          </div>
        );
      },
    },
    {
      accessorKey: "order_no",
      header: () => {
        const isSorted = filter.sortBy === "order_no";
        return (
          <Button
            variant="ghost"
            onClick={() => handleSort("order_no")}
            className="h-8 px-2"
          >
            Order #
            <ArrowUpDown
              className={`ml-2 h-4 w-4 ${isSorted ? "text-primary" : ""}`}
            />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="font-medium">{row.original.order_no}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingRecord(row.original)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteRecord(row.original.id)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: data.total_pages,
    state: {
      pagination: {
        pageIndex: filter.page - 1,
        pageSize: 10,
      },
      sorting: filter.sortBy
        ? [{ id: filter.sortBy, desc: filter.sortDirection === "desc" }]
        : [],
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h1 className="text-2xl font-bold">Review and Edit</h1>
        </div>
        <p className="text-muted-foreground">
          Step 2 of 4 • {data.count} records loaded • Page {data.current} of{" "}
          {data.total_pages}
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, address, or order number..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedRows.size} record{selectedRows.size > 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkActionType("address")}
            >
              Change Ship From
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkActionType("package")}
            >
              Change Package
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
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
                  No results.
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
          Continue to Shipping
        </Button>
      </div>

      {/* Modals */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSave={handleEditSave}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {bulkActionType && (
        <BulkActionsModal
          batchId={batch as string}
          type={bulkActionType}
          selectedCount={selectedRows.size}
          records={records}
          selectedIds={selectedRows}
          onApply={(updates) => {
            onUpdate();
            setBulkActionType(null);
            onSelectRows(new Set());
            toast.success(`${selectedRows.size} records updated successfully`);
          }}
          onClose={() => setBulkActionType(null)}
        />
      )}
    </div>
  );
}
