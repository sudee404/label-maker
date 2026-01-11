"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import type { ShipmentRecord } from "@/app/(protected)/shipments/add/page"

interface Step3ShippingProps {
  records: ShipmentRecord[]
  selectedServices: { [key: string]: "priority" | "ground" | null }
  onServiceSelected: (recordId: string, service: "priority" | "ground") => void
}

const calculatePrice = (weight: number, service: string): number => {
  if (service === "priority") {
    return 4.99 + weight * 0.5
  }
  return 2.99 + weight * 0.25
}

export default function Step3Shipping({ records, selectedServices, onServiceSelected }: Step3ShippingProps) {
  const totalPrice = records.reduce((sum, record) => {
    const service = selectedServices[record.id] || "ground"
    return sum + calculatePrice(record.package.weight, service)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Total Price */}
      <Card className="p-4 bg-accent/10 border-accent/20">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">Estimated Total:</span>
          <span className="text-3xl font-bold text-accent">${totalPrice.toFixed(2)}</span>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const service = selectedServices[record.id] || "ground"
              const price = calculatePrice(record.package.weight, service)
              return (
                <TableRow key={record.id}>
                  <TableCell className="font-mono">{record.orderNumber}</TableCell>
                  <TableCell>{record.shipTo.name}</TableCell>
                  <TableCell>{record.package.weight} lb</TableCell>
                  <TableCell>
                    <Select value={service} onValueChange={(value: any) => onServiceSelected(record.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority Mail (2-3 days)</SelectItem>
                        <SelectItem value="ground">Ground (5-7 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-semibold">${price.toFixed(2)}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
