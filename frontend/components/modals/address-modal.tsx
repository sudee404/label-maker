"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addressSchema, type AddressFormData } from "@/lib/schemas"
import { toast } from "sonner"
import type { ShipmentRecord } from "@/lib/schemas"

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT",
  "VA", "WA", "WV", "WI", "WY", "DC", "PR",
]

interface AddressModalProps {
  title: string
  initialData: AddressFormData
  onSave: (updatedAddress: AddressFormData) => void
  onClose: () => void
}

export function AddressModal({ title, initialData, onSave, onClose }: AddressModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      ...initialData,
      address_line2: initialData?.address_line2 ?? "",
      phone: initialData?.phone.replace(/\D/g, "") || "",
    },
  })

  const onSubmit = (data: AddressFormData) => {
    onSave(data)
    toast.success(`${title} updated successfully`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">First Name</label>
              <input
                {...register("first_name")}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.first_name ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.first_name && (
                <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Last Name</label>
              <input
                {...register("last_name")}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.last_name ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.last_name && (
                <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Address Line 1</label>
            <input
              {...register("address_line1")}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.address_line1 ? "border-destructive" : "border-border"
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
            />
            {errors.address_line1 && (
              <p className="text-xs text-destructive mt-1">{errors.address_line1.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Address Line 2 (Optional)</label>
            <input
              {...register("address_line2")}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">City</label>
              <input
                {...register("city")}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.city ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">State</label>
              <select
                {...register("state")}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.state ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              >
                {US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">ZIP Code</label>
              <input
                {...register("zip_code")}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.zip_code ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.zip_code && (
                <p className="text-xs text-destructive mt-1">{errors.zip_code.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Phone (10 digits recommended)</label>
            <input
              type="tel"
              {...register("phone")}
              placeholder="1234567890"
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.phone ? "border-destructive" : "border-border"
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Address
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}