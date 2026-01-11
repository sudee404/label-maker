"use client"

import { useState, useCallback } from "react"
import { apiClient, type ShipmentData } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface UseShipmentsOptions {
  onError?: (error: Error) => void
  onSuccess?: () => void
}

export function useShipments(options?: UseShipmentsOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [shipments, setShipments] = useState<ShipmentData[]>([])
  const { toast } = useToast()

  const loadShipments = useCallback(
    async (status?: string, page?: number) => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiClient.listShipments(status, page)
        setShipments(data.results)
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to load shipments")
        setError(error)
        options?.onError?.(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [options, toast],
  )

  const createShipment = useCallback(
    async (data: Partial<ShipmentData>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiClient.createShipment(data)
        setShipments((prev) => [...prev, result])
        options?.onSuccess?.()
        toast({
          title: "Success",
          description: "Shipment created successfully",
        })
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create shipment")
        setError(error)
        options?.onError?.(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [options, toast],
  )

  const updateShipment = useCallback(
    async (id: string, data: Partial<ShipmentData>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiClient.updateShipment(id, data)
        setShipments((prev) => prev.map((s) => (s.id === id ? result : s)))
        options?.onSuccess?.()
        toast({
          title: "Success",
          description: "Shipment updated successfully",
        })
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to update shipment")
        setError(error)
        options?.onError?.(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [options, toast],
  )

  const deleteShipment = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await apiClient.deleteShipment(id)
        setShipments((prev) => prev.filter((s) => s.id !== id))
        options?.onSuccess?.()
        toast({
          title: "Success",
          description: "Shipment deleted successfully",
        })
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to delete shipment")
        setError(error)
        options?.onError?.(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [options, toast],
  )

  return {
    shipments,
    loading,
    error,
    loadShipments,
    createShipment,
    updateShipment,
    deleteShipment,
  }
}
