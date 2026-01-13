"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addressSchema, type AddressFormData } from "@/lib/schemas"
import { toast } from "sonner"

interface ShipmentRecord {
  id: string
  shipFrom: any
  shipTo: any
}

interface EditAddressModalProps {
  record: ShipmentRecord
  type: "from" | "to"
  onSave: (record: ShipmentRecord) => void
  onClose: () => void
}

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
  "PR",
]

export function EditAddressModal({ record, type, onSave, onClose }: EditAddressModalProps) {
  const addressData = type === "from" ? record.shipFrom : record.shipTo

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: addressData,
  })

  const onSubmit = (data: AddressFormData) => {
    const updated = { ...record }
    if (type === "from") {
      updated.shipFrom = data
    } else {
      updated.shipTo = data
    }
    onSave(updated)
    toast.success("Address updated successfully")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Edit {type === "from" ? "Ship From" : "Ship To"} Address
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-96 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
            <input
              type="text"
              {...register("firstName")}
              className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                errors.firstName ? "border-destructive" : "border-border"
              }`}
            />
            {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
            <input
              type="text"
              {...register("lastName")}
              className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                errors.lastName ? "border-destructive" : "border-border"
              }`}
            />
            {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address</label>
            <input
              type="text"
              {...register("address")}
              className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                errors.address ? "border-destructive" : "border-border"
              }`}
            />
            {errors.address && <p className="text-xs text-destructive mt-1">{errors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Address 2</label>
            <input
              type="text"
              {...register("address2")}
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">City</label>
              <input
                type="text"
                {...register("city")}
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.city ? "border-destructive" : "border-border"
                }`}
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">State</label>
              <select
                {...register("state")}
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.state ? "border-destructive" : "border-border"
                }`}
              >
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">ZIP Code</label>
            <input
              type="text"
              {...register("zip")}
              className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                errors.zip ? "border-destructive" : "border-border"
              }`}
            />
            {errors.zip && <p className="text-xs text-destructive mt-1">{errors.zip.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
            <input
              type="tel"
              {...register("phone")}
              className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                errors.phone ? "border-destructive" : "border-border"
              }`}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
