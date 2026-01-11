"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, AlertCircle, CheckCircle } from "lucide-react"
import type { ShipmentRecord } from "@/app/(protected)/shipments/add"

const states = [
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
]

interface Step1UploadProps {
  onRecordsLoaded: (records: ShipmentRecord[]) => void
}

export default function Step1Upload({ onRecordsLoaded }: Step1UploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [parseResult, setParseResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const validateRecord = (row: Record<string, any>, rowIndex: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Validate From Address
    if (!row["Ship From Name"]) errors.push(`Row ${rowIndex}: Ship From Name is required`)
    if (!row["Ship From Address"]) errors.push(`Row ${rowIndex}: Ship From Address is required`)
    if (!row["Ship From City"]) errors.push(`Row ${rowIndex}: Ship From City is required`)
    if (!row["Ship From State"] || !states.includes(row["Ship From State"]))
      errors.push(`Row ${rowIndex}: Invalid Ship From State`)
    if (!row["Ship From ZIP"] || !/^\d{5}(-\d{4})?$/.test(row["Ship From ZIP"]))
      errors.push(`Row ${rowIndex}: Invalid Ship From ZIP format`)

    // Validate To Address
    if (!row["Ship To Name"]) errors.push(`Row ${rowIndex}: Ship To Name is required`)
    if (!row["Ship To Address"]) errors.push(`Row ${rowIndex}: Ship To Address is required`)
    if (!row["Ship To City"]) errors.push(`Row ${rowIndex}: Ship To City is required`)
    if (!row["Ship To State"] || !states.includes(row["Ship To State"]))
      errors.push(`Row ${rowIndex}: Invalid Ship To State`)
    if (!row["Ship To ZIP"] || !/^\d{5}(-\d{4})?$/.test(row["Ship To ZIP"]))
      errors.push(`Row ${rowIndex}: Invalid Ship To ZIP format`)

    // Validate Package
    if (!row["Weight"] || isNaN(Number.parseFloat(row["Weight"])))
      errors.push(`Row ${rowIndex}: Weight must be a number`)
    if (!row["Length"] || isNaN(Number.parseFloat(row["Length"])))
      errors.push(`Row ${rowIndex}: Length must be a number`)
    if (!row["Width"] || isNaN(Number.parseFloat(row["Width"]))) errors.push(`Row ${rowIndex}: Width must be a number`)
    if (!row["Height"] || isNaN(Number.parseFloat(row["Height"])))
      errors.push(`Row ${rowIndex}: Height must be a number`)

    return { valid: errors.length === 0, errors }
  }

  const parseCSV = (text: string): ShipmentRecord[] => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(",").map((h) => h.trim())
    const records: ShipmentRecord[] = []
    let successCount = 0
    const allErrors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx] || ""]))

      const { valid, errors } = validateRecord(row, i)

      records.push({
        id: `SHP${Date.now()}-${i}`,
        shipFrom: {
          name: row["Ship From Name"] || "",
          address: row["Ship From Address"] || "",
          city: row["Ship From City"] || "",
          state: row["Ship From State"] || "",
          zip: row["Ship From ZIP"] || "",
          country: "US",
        },
        shipTo: {
          name: row["Ship To Name"] || "",
          address: row["Ship To Address"] || "",
          city: row["Ship To City"] || "",
          state: row["Ship To State"] || "",
          zip: row["Ship To ZIP"] || "",
          country: "US",
        },
        package: {
          weight: Number.parseFloat(row["Weight"]) || 0,
          length: Number.parseFloat(row["Length"]) || 0,
          width: Number.parseFloat(row["Width"]) || 0,
          height: Number.parseFloat(row["Height"]) || 0,
          description: row["Description"] || "",
        },
        orderNumber: row["Order Number"] || `ORD-${i}`,
        validation: { isValid: valid, errors },
      })

      if (valid) successCount++
      allErrors.push(...errors)
    }

    setParseResult({ success: successCount, failed: records.length - successCount, errors: allErrors.slice(0, 5) })
    return records
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      alert("Please upload a CSV file")
      return
    }

    setIsLoading(true)
    try {
      const text = await file.text()
      const records = parseCSV(text)

      if (records.length > 0) {
        onRecordsLoaded(records)
      }
    } catch (error) {
      alert("Error parsing CSV file")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragging ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
        <p className="text-muted-foreground mb-4">Drag and drop your file or click to browse</p>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFile(e.target.files[0])
            }
          }}
          className="hidden"
          id="csv-input"
        />

        <label htmlFor="csv-input">
          <Button asChild variant="outline" className="cursor-pointer bg-transparent">
            <span>Select File</span>
          </Button>
        </label>
      </div>

      {parseResult && (
        <div className="space-y-3">
          <div className="flex gap-4">
            <Card className="flex-1 p-4 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Valid Records</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{parseResult.success}</p>
            </Card>

            <Card className="flex-1 p-4 bg-red-500/10 border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Invalid Records</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{parseResult.failed}</p>
            </Card>
          </div>

          {parseResult.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {parseResult.errors.map((error, idx) => (
                    <p key={idx} className="text-sm">
                      {error}
                    </p>
                  ))}
                  {parseResult.errors.length < parseResult.failed && (
                    <p className="text-sm">... and {parseResult.failed - parseResult.errors.length} more errors</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">CSV Format Required:</h4>
        <p className="text-sm text-muted-foreground font-mono text-xs">
          Ship From Name, Ship From Address, Ship From City, Ship From State, Ship From ZIP, Ship To Name, Ship To
          Address, Ship To City, Ship To State, Ship To ZIP, Weight, Length, Width, Height, Description, Order Number
        </p>
      </div>
    </div>
  )
}
