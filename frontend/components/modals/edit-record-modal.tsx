"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { z } from "zod"
import { toast } from "sonner"

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

const editRecordSchema = z.object({
  shipFromFirstName: z.string().min(1, "First name required"),
  shipFromLastName: z.string().min(1, "Last name required"),
  shipFromAddress: z.string().min(1, "Address required"),
  shipFromAddress2: z.string().optional(),
  shipFromCity: z.string().min(1, "City required"),
  shipFromState: z.string().min(2, "State required"),
  shipFromZip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  shipFromPhone: z
    .string()
    .min(1, "Phone required")
    .refine((val) => /^\d{10}$/.test(val.replace(/\D/g, "")), "Phone must be 10 digits"),
  shipToFirstName: z.string().min(1, "First name required"),
  shipToLastName: z.string().min(1, "Last name required"),
  shipToAddress: z.string().min(1, "Address required"),
  shipToAddress2: z.string().optional(),
  shipToCity: z.string().min(1, "City required"),
  shipToState: z.string().min(2, "State required"),
  shipToZip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  shipToPhone: z
    .string()
    .min(1, "Phone required")
    .refine((val) => /^\d{10}$/.test(val.replace(/\D/g, "")), "Phone must be 10 digits"),
  length: z.coerce.number().min(0.01, "Length must be greater than 0"),
  width: z.coerce.number().min(0.01, "Width must be greater than 0"),
  height: z.coerce.number().min(0.01, "Height must be greater than 0"),
  lbs: z.coerce.number().min(0, "Weight cannot be negative"),
  oz: z.coerce.number().min(0).max(15.9, "Ounces must be 0-15"),
  sku: z.string().optional(),
})

type EditRecordFormData = z.infer<typeof editRecordSchema>

interface ShipmentRecord {
  id: string
  shipFrom: any
  shipTo: any
  package: any
}

interface EditRecordModalProps {
  record: ShipmentRecord
  onSave: (record: ShipmentRecord) => void
  onClose: () => void
}

export function EditRecordModal({ record, onSave, onClose }: EditRecordModalProps) {
  const sanitizePhone = (phone: string | undefined | null): string => {
    if (!phone) return ""
    return phone.replace(/\D/g, "")
  }

  const ensureNumber = (value: any, fallback = 0): number => {
    const num = Number(value)
    return isNaN(num) ? fallback : num
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditRecordFormData>({
    resolver: zodResolver(editRecordSchema),
    mode: "onBlur",
    defaultValues: {
      shipFromFirstName: record.shipFrom?.firstName || "",
      shipFromLastName: record.shipFrom?.lastName || "",
      shipFromAddress: record.shipFrom?.address || "",
      shipFromAddress2: record.shipFrom?.address2 || "",
      shipFromCity: record.shipFrom?.city || "",
      shipFromState: record.shipFrom?.state || "CA",
      shipFromZip: record.shipFrom?.zip || "",
      shipFromPhone: sanitizePhone(record.shipFrom?.phone),
      shipToFirstName: record.shipTo?.firstName || "",
      shipToLastName: record.shipTo?.lastName || "",
      shipToAddress: record.shipTo?.address || "",
      shipToAddress2: record.shipTo?.address2 || "",
      shipToCity: record.shipTo?.city || "",
      shipToState: record.shipTo?.state || "CA",
      shipToZip: record.shipTo?.zip || "",
      shipToPhone: sanitizePhone(record.shipTo?.phone),
      length: ensureNumber(record.package?.length),
      width: ensureNumber(record.package?.width),
      height: ensureNumber(record.package?.height),
      lbs: ensureNumber(record.package?.lbs),
      oz: ensureNumber(record.package?.oz),
      sku: record.package?.sku || "",
    },
  })

  const onSubmit = (data: EditRecordFormData) => {
    const updated: ShipmentRecord = {
      ...record,
      shipFrom: {
        firstName: data.shipFromFirstName,
        lastName: data.shipFromLastName,
        address: data.shipFromAddress,
        address2: data.shipFromAddress2,
        city: data.shipFromCity,
        state: data.shipFromState,
        zip: data.shipFromZip,
        phone: data.shipFromPhone,
      },
      shipTo: {
        firstName: data.shipToFirstName,
        lastName: data.shipToLastName,
        address: data.shipToAddress,
        address2: data.shipToAddress2,
        city: data.shipToCity,
        state: data.shipToState,
        zip: data.shipToZip,
        phone: data.shipToPhone,
      },
      package: {
        length: data.length,
        width: data.width,
        height: data.height,
        lbs: data.lbs,
        oz: data.oz,
        sku: data.sku,
      },
    }
    onSave(updated)
    toast.success("Record updated successfully")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">Edit Shipment Record</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Ship From Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
              Ship From
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                <input
                  type="text"
                  {...register("shipFromFirstName")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipFromFirstName ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipFromFirstName && (
                  <p className="text-xs text-destructive mt-1">{errors.shipFromFirstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                <input
                  type="text"
                  {...register("shipFromLastName")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipFromLastName ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipFromLastName && (
                  <p className="text-xs text-destructive mt-1">{errors.shipFromLastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <input
                type="text"
                {...register("shipFromAddress")}
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.shipFromAddress ? "border-destructive" : "border-border"
                }`}
              />
              {errors.shipFromAddress && (
                <p className="text-xs text-destructive mt-1">{errors.shipFromAddress.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address 2 (Optional)</label>
              <input
                type="text"
                {...register("shipFromAddress2")}
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">City</label>
                <input
                  type="text"
                  {...register("shipFromCity")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipFromCity ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipFromCity && <p className="text-xs text-destructive mt-1">{errors.shipFromCity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State</label>
                <select
                  {...register("shipFromState")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipFromState ? "border-destructive" : "border-border"
                  }`}
                >
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.shipFromState && (
                  <p className="text-xs text-destructive mt-1">{errors.shipFromState.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ZIP</label>
                <input
                  type="text"
                  {...register("shipFromZip")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipFromZip ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipFromZip && <p className="text-xs text-destructive mt-1">{errors.shipFromZip.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone (10 digits)</label>
              <input
                type="tel"
                {...register("shipFromPhone")}
                placeholder="1234567890"
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.shipFromPhone ? "border-destructive" : "border-border"
                }`}
              />
              {errors.shipFromPhone && <p className="text-xs text-destructive mt-1">{errors.shipFromPhone.message}</p>}
            </div>
          </div>

          {/* Ship To Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
              Ship To
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                <input
                  type="text"
                  {...register("shipToFirstName")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipToFirstName ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipToFirstName && (
                  <p className="text-xs text-destructive mt-1">{errors.shipToFirstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                <input
                  type="text"
                  {...register("shipToLastName")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipToLastName ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipToLastName && (
                  <p className="text-xs text-destructive mt-1">{errors.shipToLastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address</label>
              <input
                type="text"
                {...register("shipToAddress")}
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.shipToAddress ? "border-destructive" : "border-border"
                }`}
              />
              {errors.shipToAddress && <p className="text-xs text-destructive mt-1">{errors.shipToAddress.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Address 2 (Optional)</label>
              <input
                type="text"
                {...register("shipToAddress2")}
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">City</label>
                <input
                  type="text"
                  {...register("shipToCity")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipToCity ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipToCity && <p className="text-xs text-destructive mt-1">{errors.shipToCity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">State</label>
                <select
                  {...register("shipToState")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipToState ? "border-destructive" : "border-border"
                  }`}
                >
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.shipToState && <p className="text-xs text-destructive mt-1">{errors.shipToState.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">ZIP</label>
                <input
                  type="text"
                  {...register("shipToZip")}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.shipToZip ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.shipToZip && <p className="text-xs text-destructive mt-1">{errors.shipToZip.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Phone (10 digits)</label>
              <input
                type="tel"
                {...register("shipToPhone")}
                placeholder="1234567890"
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.shipToPhone ? "border-destructive" : "border-border"
                }`}
              />
              {errors.shipToPhone && <p className="text-xs text-destructive mt-1">{errors.shipToPhone.message}</p>}
            </div>
          </div>

          {/* Package Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">
              Package Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">SKU / Item ID</label>
              <input
                type="text"
                {...register("sku")}
                className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Length (in)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("length", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.length ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.length && <p className="text-xs text-destructive mt-1">{errors.length.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Width (in)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("width", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.width ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.width && <p className="text-xs text-destructive mt-1">{errors.width.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Height (in)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("height", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.height ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.height && <p className="text-xs text-destructive mt-1">{errors.height.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Lbs</label>
                <input
                  type="number"
                  step="0.1"
                  {...register("lbs", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                    errors.lbs ? "border-destructive" : "border-border"
                  }`}
                />
                {errors.lbs && <p className="text-xs text-destructive mt-1">{errors.lbs.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ounces</label>
              <input
                type="number"
                step="0.1"
                {...register("oz", { valueAsNumber: true })}
                className={`w-full px-3 py-2 bg-muted border rounded text-foreground text-sm ${
                  errors.oz ? "border-destructive" : "border-border"
                }`}
              />
              {errors.oz && <p className="text-xs text-destructive mt-1">{errors.oz.message}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 pt-6 border-t border-border sticky bottom-0 bg-card">
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
