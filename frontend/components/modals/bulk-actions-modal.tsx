"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { z } from "zod"
import { ShipmentRecord } from "@/lib/schemas"

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

const bulkAddressSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  address: z.string().min(1, "Address required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City required"),
  state: z.string().min(2, "State required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  phone: z
    .string()
    .min(1, "Phone required")
    .refine((val) => /^\d{10}$/.test(val.replace(/\D/g, "")), "Phone must be 10 digits"),
})

const bulkPackageSchema = z.object({
  length: z.coerce.number().min(0.01, "Length must be greater than 0"),
  width: z.coerce.number().min(0.01, "Width must be greater than 0"),
  height: z.coerce.number().min(0.01, "Height must be greater than 0"),
  lbs: z.coerce.number().min(0, "Weight cannot be negative"),
  oz: z.coerce.number().min(0).max(15.9, "Ounces must be 0-15"),
})

type BulkAddressFormData = z.infer<typeof bulkAddressSchema>
type BulkPackageFormData = z.infer<typeof bulkPackageSchema>


interface BulkActionsModalProps {
  type: "address" | "package"
  selectedCount: number
  records: ShipmentRecord[]
  selectedIds: Set<string>
  onApply: (updates: any) => void
  onClose: () => void
}

export function BulkActionsModal({
  type,
  selectedCount,
  records,
  selectedIds,
  onApply,
  onClose,
}: BulkActionsModalProps) {
  const [useCustom, setUseCustom] = useState(true)

  const addressForm = useForm<BulkAddressFormData>({
    resolver: zodResolver(bulkAddressSchema),
    mode: "onBlur",
    defaultValues: {
      first_name: "",
      last_name: "",
      address: "",
      address_line2: "",
      city: "",
      state: "CA",
      zip: "",
      phone: "",
    },
  })

  const packageForm = useForm<BulkPackageFormData>({
    resolver: zodResolver(bulkPackageSchema),
    mode: "onBlur",
    defaultValues: {
      length: 12,
      width: 12,
      height: 12,
      lbs: 2,
      oz: 0,
    },
  })

  const onAddressSubmit = (data: BulkAddressFormData) => {
    onApply({
      shipFrom: {
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
      },
    })
    toast.success(`Applied address to ${selectedCount} record(s)`)
    onClose()
  }

  const onPackageSubmit = (data: BulkPackageFormData) => {
    onApply({
      package: {
        length: data.length,
        width: data.width,
        height: data.height,
        lbs: data.lbs,
        oz: data.oz,
        sku: "",
      },
    })
    toast.success(`Applied package details to ${selectedCount} record(s)`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            {type === "address" ? "Change Ship From Address" : "Change Package Details"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Apply to {selectedCount} selected record{selectedCount > 1 ? "s" : ""}
          </p>

          {type === "address" ? (
            <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                  <input
                    type="text"
                    {...addressForm.register("first_name")}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      addressForm.formState.errors.first_name ? "border-destructive" : "border-border"
                    }`}
                  />
                  {addressForm.formState.errors.first_name && (
                    <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                  <input
                    type="text"
                    {...addressForm.register("last_name")}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      addressForm.formState.errors.last_name ? "border-destructive" : "border-border"
                    }`}
                  />
                  {addressForm.formState.errors.last_name && (
                    <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.last_name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input
                  type="text"
                  {...addressForm.register("address")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    addressForm.formState.errors.address ? "border-destructive" : "border-border"
                  }`}
                />
                {addressForm.formState.errors.address && (
                  <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.address.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address 2 (Optional)</label>
                <input
                  type="text"
                  {...addressForm.register("address_line2")}
                  className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">City</label>
                  <input
                    type="text"
                    {...addressForm.register("city")}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      addressForm.formState.errors.city ? "border-destructive" : "border-border"
                    }`}
                  />
                  {addressForm.formState.errors.city && (
                    <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">State</label>
                  <select
                    {...addressForm.register("state")}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      addressForm.formState.errors.state ? "border-destructive" : "border-border"
                    }`}
                  >
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  {addressForm.formState.errors.state && (
                    <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ZIP</label>
                  <input
                    type="text"
                    {...addressForm.register("zip")}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      addressForm.formState.errors.zip ? "border-destructive" : "border-border"
                    }`}
                  />
                  {addressForm.formState.errors.zip && (
                    <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.zip.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone (10 digits)</label>
                <input
                  type="tel"
                  {...addressForm.register("phone")}
                  placeholder="1234567890"
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    addressForm.formState.errors.phone ? "border-destructive" : "border-border"
                  }`}
                />
                {addressForm.formState.errors.phone && (
                  <p className="text-xs text-destructive mt-1">{addressForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Apply to {selectedCount} Record{selectedCount > 1 ? "s" : ""}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={packageForm.handleSubmit(onPackageSubmit)} className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Length (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...packageForm.register("length", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      packageForm.formState.errors.length ? "border-destructive" : "border-border"
                    }`}
                  />
                  {packageForm.formState.errors.length && (
                    <p className="text-xs text-destructive mt-1">{packageForm.formState.errors.length.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Width (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...packageForm.register("width", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      packageForm.formState.errors.width ? "border-destructive" : "border-border"
                    }`}
                  />
                  {packageForm.formState.errors.width && (
                    <p className="text-xs text-destructive mt-1">{packageForm.formState.errors.width.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Height (in)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...packageForm.register("height", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      packageForm.formState.errors.height ? "border-destructive" : "border-border"
                    }`}
                  />
                  {packageForm.formState.errors.height && (
                    <p className="text-xs text-destructive mt-1">{packageForm.formState.errors.height.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Lbs</label>
                  <input
                    type="number"
                    step="0.1"
                    {...packageForm.register("lbs", { valueAsNumber: true })}
                    className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                      packageForm.formState.errors.lbs ? "border-destructive" : "border-border"
                    }`}
                  />
                  {packageForm.formState.errors.lbs && (
                    <p className="text-xs text-destructive mt-1">{packageForm.formState.errors.lbs.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ounces</label>
                <input
                  type="number"
                  step="0.1"
                  {...packageForm.register("oz", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    packageForm.formState.errors.oz ? "border-destructive" : "border-border"
                  }`}
                />
                {packageForm.formState.errors.oz && (
                  <p className="text-xs text-destructive mt-1">{packageForm.formState.errors.oz.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-border">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
                  Apply to {selectedCount} Record{selectedCount > 1 ? "s" : ""}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
