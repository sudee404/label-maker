"use client"

import { useState, useCallback } from "react"
import { apiClient, type ShipmentData } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface UploadResult {
  records: ShipmentData[]
  errors: string[]
}

export function useBulkUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.uploadBulkShipments(file)

        if (result.errors && result.errors.length > 0) {
          toast({
            title: "Partial Success",
            description: `${result.records.length} records uploaded with ${result.errors.length} errors`,
            variant: "default",
          })
        } else {
          toast({
            title: "Success",
            description: `${result.records.length} shipments uploaded successfully`,
          })
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to upload file")
        setError(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return { uploadFile, loading, error }
}
