"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { shipmentSchema, type ShipmentInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ShipmentFormProps {
  onSuccess?: () => void
}

export function ShipmentForm({ onSuccess }: ShipmentFormProps) {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShipmentInput>({
    resolver: zodResolver(shipmentSchema),
  })

  async function onSubmit(data: ShipmentInput) {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "/api/shipments/",
          method: "POST",
          data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create shipment")
      } else {
        reset()
        onSuccess?.()
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Shipment</CardTitle>
        <CardDescription>Enter the details for your bulk shipment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="origin" className="text-sm font-medium">
                Origin
              </label>
              <Input id="origin" placeholder="City or postal code" {...register("origin")} disabled={isLoading} />
              {errors.origin && <p className="text-sm text-red-500">{errors.origin.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="destination" className="text-sm font-medium">
                Destination
              </label>
              <Input
                id="destination"
                placeholder="City or postal code"
                {...register("destination")}
                disabled={isLoading}
              />
              {errors.destination && <p className="text-sm text-red-500">{errors.destination.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="weight" className="text-sm font-medium">
                Weight (kg)
              </label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="0.0"
                {...register("weight", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.weight && <p className="text-sm text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                {...register("quantity", { valueAsNumber: true })}
                disabled={isLoading}
              />
              {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <label htmlFor="estimatedDelivery" className="text-sm font-medium">
                Estimated Delivery Date
              </label>
              <Input id="estimatedDelivery" type="date" {...register("estimatedDelivery")} disabled={isLoading} />
              {errors.estimatedDelivery && <p className="text-sm text-red-500">{errors.estimatedDelivery.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input
                id="description"
                placeholder="Shipment details..."
                {...register("description")}
                disabled={isLoading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating shipment..." : "Create Shipment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
