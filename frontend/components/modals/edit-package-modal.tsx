"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { packageSchema, type PackageFormData } from "@/lib/schemas"
import { toast } from "sonner"

interface ShipmentRecord {
  id: string
  package: any
}

interface EditPackageModalProps {
  record: ShipmentRecord
  onSave: (record: ShipmentRecord) => void
  onClose: () => void
}

export function EditPackageModal({ record, onSave, onClose }: EditPackageModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: record.package,
  })

  const onSubmit = (data: PackageFormData) => {
    const updated = {
      ...record,
      package: data,
    }
    onSave(updated)
    toast.success("Package details updated successfully")
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Package Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">SKU / Item ID</label>
            <input
              type="text"
              {...register("sku")}
              className="w-full px-3 py-2 bg-muted border border-border rounded text-foreground text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Weight (lbs)</label>
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Weight (oz)</label>
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
