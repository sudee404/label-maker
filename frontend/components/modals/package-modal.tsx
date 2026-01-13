"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { packageSchema, type PackageFormData } from "@/lib/schemas"
import { toast } from "sonner"

interface PackageModalProps {
  initialData: PackageFormData
  onSave: (updatedPackage: PackageFormData) => void
  onClose: () => void
}

export function PackageModal({ initialData, onSave, onClose }: PackageModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      ...initialData,
      sku: initialData?.sku ?? "",
    },
  })

  const onSubmit = (data: PackageFormData) => {
    onSave(data)
    toast.success("Package details updated")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold">Package Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">SKU / Item ID (optional)</label>
            <input
              {...register("sku")}
              className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Length (in)</label>
              <input
                type="number"
                step="0.1"
                {...register("length_inches", { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.length_inches ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.length_inches && (
                <p className="text-xs text-destructive mt-1">{errors.length_inches.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Width (in)</label>
              <input
                type="number"
                step="0.1"
                {...register("width_inches", { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.width_inches ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.width_inches && (
                <p className="text-xs text-destructive mt-1">{errors.width_inches.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Height (in)</label>
              <input
                type="number"
                step="0.1"
                {...register("height_inches", { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.height_inches ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.height_inches && (
                <p className="text-xs text-destructive mt-1">{errors.height_inches.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Weight (lbs)</label>
              <input
                type="number"
                step="0.1"
                {...register("weight_lbs", { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-md text-sm ${
                  errors.weight_lbs ? "border-destructive" : "border-border"
                } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
              />
              {errors.weight_lbs && (
                <p className="text-xs text-destructive mt-1">{errors.weight_lbs.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Ounces (0–15.99)</label>
            <input
              type="number"
              step="0.01"
              {...register("weight_oz", { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-md text-sm ${
                errors.weight_oz ? "border-destructive" : "border-border"
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/30`}
            />
            {errors.weight_oz && (
              <p className="text-xs text-destructive mt-1">{errors.weight_oz.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Package
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}