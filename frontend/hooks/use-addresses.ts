"use client"

import { useState, useCallback, useEffect } from "react"
import { apiClient, type AddressData } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export function useAddresses() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadAddresses()
  }, [])

  const loadAddresses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.listAddresses()
      setAddresses(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load addresses")
      setError(error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createAddress = useCallback(
    async (data: Partial<AddressData>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiClient.createAddress(data)
        setAddresses((prev) => [...prev, result])
        toast({
          title: "Success",
          description: "Address saved successfully",
        })
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create address")
        setError(error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return { addresses, loading, error, createAddress, loadAddresses }
}
