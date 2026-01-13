"use client"

import type React from "react"
import { useState } from "react"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { ShipmentRecord } from "@/lib/schemas";


interface UploadStepProps {
  onUpload: (records: ShipmentRecord[]) => void
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [recordCount, setRecordCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = async (file: File | null) => {
    if (!file) return

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      setUploadStatus("error")
      setStatusMessage("Please upload a CSV file")
      return
    }

    setIsLoading(true)
    setUploadStatus("idle")
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return 90
          return prev + Math.random() * 30
        })
      }, 300)

      const response = await fetch("/api/csv-parse", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        setRecordCount(result.count)
        setUploadStatus("success")
        setStatusMessage(`Successfully parsed ${result.count} shipment records`)

        // Delay before proceeding
        setTimeout(() => {
          onUpload(result.data)
          toast.success(`Uploaded ${result.count} records successfully!`)
        }, 1000)
      } else {
        setUploadStatus("error")
        setStatusMessage(result.error || "Failed to parse CSV")
        toast.error("Failed to parse CSV file")
      }
    } catch (error) {
      setUploadStatus("error")
      setStatusMessage("Error processing file. Please try again.")
      toast.error("Error processing file")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    handleFileSelect(file || null)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h1 className="text-2xl font-bold text-foreground">Upload Spreadsheet</h1>
        </div>
        <p className="text-muted-foreground">Step 1 of 4</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Upload Area */}
        <div className="md:col-span-2">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary"
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center transition-colors ${
                  isDragging ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Upload className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Drag and drop your CSV file</h3>
                <p className="text-muted-foreground text-sm mb-4">or click to browse your computer</p>
              </div>

              <label className="cursor-pointer">
                <input type="file" accept=".csv" onChange={handleInputChange} disabled={isLoading} className="hidden" />
                <Button
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement
                    input?.click()
                  }}
                >
                  {isLoading ? "Processing..." : "Select File"}
                </Button>
              </label>

              <p className="text-xs text-muted-foreground">Supported format: CSV (.csv)</p>
            </div>
          </div>

          {isLoading && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}% complete</p>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus !== "idle" && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                uploadStatus === "success"
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {uploadStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-card rounded-lg p-6 border border-border h-fit">
          <h3 className="font-semibold text-foreground mb-4">Getting Started</h3>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">File Format</h4>
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with shipping records. Each row represents one shipment.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Required Fields</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Recipient name & address</li>
                <li>• City, State, ZIP</li>
                <li>• Order number</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Download Template</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-border bg-transparent"
                onClick={() => {
                  // Generate template CSV
                  const template = `From,,,,,,,To,,,,,,,weight*,weight*,Dimensions*,Dimensions*,Dimensions*,,,,
First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,lbs,oz,Length,width,Height,phone num1,phone num2,order no,Item-sku
Print,TTS,502 W Arrow Hwy,STE P,San Dimas,91773,CA,John,Doe,123 Main St,Apt 101,Los Angeles,90210,CA,2,4,12,8,6,(626)555-0100,(626)555-0101,ORD-001,SKU-001`
                  const element = document.createElement("a")
                  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(template))
                  element.setAttribute("download", "Template.csv")
                  element.click()
                }}
              >
                Download Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
