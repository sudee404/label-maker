"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import type { ShipmentRecord } from "@/app/(protected)/shipments/add/page"

interface Step2ReviewProps {
  records: ShipmentRecord[]
  onRecordsUpdated: (records: ShipmentRecord[]) => void
}

export default function Step2Review({ records, onRecordsUpdated }: Step2ReviewProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [editingRecord, setEditingRecord] = useState<ShipmentRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRecords = records.filter(
    (r) =>
      r.shipTo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shipTo.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDelete = (id: string) => {
    onRecordsUpdated(records.filter((r) => r.id !== id))
  }

  const handleBulkDelete = () => {
    onRecordsUpdated(records.filter((r) => !selectedRows.has(r.id)))
    setSelectedRows(new Set())
  }

  const handleSaveEdit = (updated: ShipmentRecord) => {
    onRecordsUpdated(records.map((r) => (r.id === updated.id ? updated : r)))
    setEditingRecord(null)
  }

  const validCount = records.filter((r) => r.validation.isValid).length
  const invalidCount = records.length - validCount

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{validCount}</p>
        </div>

        <div className="flex-1 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">Issues Found</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{invalidCount}</p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by recipient name, address, or order number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedRows.size === filteredRecords.length && filteredRecords.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(filteredRecords.map((r) => r.id)))
                    } else {
                      setSelectedRows(new Set())
                    }
                  }}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(record.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedRows)
                      if (e.target.checked) {
                        newSet.add(record.id)
                      } else {
                        newSet.delete(record.id)
                      }
                      setSelectedRows(newSet)
                    }}
                  />
                </TableCell>
                <TableCell>
                  {record.validation.isValid ? (
                    <Badge className="bg-green-500/20 text-green-700">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">Invalid</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">{record.orderNumber}</TableCell>
                <TableCell>{record.shipTo.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {record.shipTo.address}, {record.shipTo.city}, {record.shipTo.state} {record.shipTo.zip}
                </TableCell>
                <TableCell>{record.package.weight} lb</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingRecord(record)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex gap-2 p-4 bg-muted/50 rounded-lg">
          <span className="flex-1 text-sm">{selectedRows.size} records selected</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      {editingRecord && (
        <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Record: {editingRecord.orderNumber}</DialogTitle>
            </DialogHeader>
            {/* ... Content omitted for brevity, would show form fields ... */}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
