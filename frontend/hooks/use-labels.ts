"use client"

import { useState, useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export function useLabels() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const generateLabels = useCallback(
    async (shipmentIds: string[], labelSize: string) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiClient.generateLabels(shipmentIds, labelSize)
        toast({
          title: "Success",
          description: "Labels generated successfully",
        })
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to generate labels")
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

  return { generateLabels, loading, error }
}
