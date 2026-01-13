"use client"

import { useState, useMemo } from "react"
import { Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BulkActionsModal } from "@/components/modals/bulk-actions-modal"
import { EditRecordModal } from "@/components/modals/edit-record-modal"
import { toast } from "sonner"

interface ShipmentRecord {
  id: string
  shipFrom: any
  shipTo: any
  package: any
  orderNo: string
  shippingService?: string
  shippingPrice?: number
}

interface ReviewStepProps {
  records: ShipmentRecord[]
  onUpdate: (records: ShipmentRecord[]) => void
  onContinue: () => void
  onBack: () => void
  selectedRows: Set<string>
  onSelectRows: (rows: Set<string>) => void
  savedAddresses?: Record<string, any>
  savedPackages?: Record<string, any>
}

const ITEMS_PER_PAGE = 10

export function ReviewStep({ records, onUpdate, onContinue, onBack, selectedRows, onSelectRows }: ReviewStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [editingRecord, setEditingRecord] = useState<ShipmentRecord | null>(null)
  const [bulkActionType, setBulkActionType] = useState<"address" | "package" | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchLower = searchTerm.toLowerCase()
      return (
        record.shipTo.firstName.toLowerCase().includes(searchLower) ||
        record.shipTo.lastName.toLowerCase().includes(searchLower) ||
        record.shipTo.address.toLowerCase().includes(searchLower) ||
        record.orderNo.toLowerCase().includes(searchLower)
      )
    })
  }, [records, searchTerm])

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRecords, currentPage])

  const handleSelectAll = () => {
    if (selectedRows.size === paginatedRecords.length) {
      onSelectRows(new Set())
    } else {
      onSelectRows(new Set(paginatedRecords.map((r) => r.id)))
    }
  }

  const handleSelectRow = (id: string) => {
    const newSelection = new Set(selectedRows)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    onSelectRows(newSelection)
  }

  const handleDeleteRecord = (id: string) => {
    toast((t) => (
      <div className="space-y-2">
        <p className="font-medium">Delete this record?</p>
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdate(records.filter((r) => r.id !== id))
              selectedRows.delete(id)
              toast.dismiss(t)
              toast.success("Record deleted successfully")
            }}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </div>
    ))
  }

  const handleEditSave = (updatedRecord: ShipmentRecord) => {
    onUpdate(records.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)))
    setEditingRecord(null)
    toast.success("Record updated successfully")
  }

  const handleBulkDelete = () => {
    toast((t) => (
      <div className="space-y-2">
        <p className="font-medium">Delete {selectedRows.size} record(s)?</p>
        <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onUpdate(records.filter((r) => !selectedRows.has(r.id)))
              onSelectRows(new Set())
              toast.dismiss(t)
              toast.success(`${selectedRows.size} records deleted`)
            }}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
          >
            Delete All
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </div>
    ))
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h1 className="text-2xl font-bold text-foreground">Review and Edit</h1>
        </div>
        <p className="text-muted-foreground">
          Step 2 of 4 • {records.length} records loaded • Page {currentPage} of {totalPages}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, address, or order number..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="flex-1 bg-transparent outline-none text-foreground placeholder-muted-foreground text-sm"
        />
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            {selectedRows.size} record{selectedRows.size > 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkActionType("address")}>
              Change Ship From Address
            </Button>
            <Button size="sm" variant="outline" onClick={() => setBulkActionType("package")}>
              Change Package Details
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
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
                    checked={selectedRows.size === paginatedRecords.length && paginatedRecords.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-border cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ship From</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ship To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Package</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
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
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-foreground">
                      {record.shipFrom.firstName} {record.shipFrom.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {record.shipFrom.city}, {record.shipFrom.state}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-foreground">
                      {record.shipTo.firstName} {record.shipTo.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{record.shipTo.address}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {record.package.length}x{record.package.width}x{record.package.height}" • {record.package.lbs}lb{" "}
                    {record.package.oz}oz
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{record.orderNo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length} records
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
          Continue to Shipping
        </Button>
      </div>

      {/* Modals */}
      {editingRecord && (
        <EditRecordModal record={editingRecord} onSave={handleEditSave} onClose={() => setEditingRecord(null)} />
      )}

      {bulkActionType && (
        <BulkActionsModal
          type={bulkActionType}
          selectedCount={selectedRows.size}
          records={records}
          selectedIds={selectedRows}
          onApply={(updates) => {
            const updated = records.map((r) => (selectedRows.has(r.id) ? { ...r, ...updates } : r))
            onUpdate(updated)
            setBulkActionType(null)
            onSelectRows(new Set())
            toast.success(`${selectedRows.size} records updated successfully`)
          }}
          onClose={() => setBulkActionType(null)}
        />
      )}
    </div>
  )
}
