"use client";

import React, { useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ShipmentRecord } from "@/lib/schemas";

interface UploadStepProps {
  onUpload: (batchId: string) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [recordCount, setRecordCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      setUploadStatus("error");
      setStatusMessage("Invalid file format");
      return;
    }

    setIsLoading(true);
    setUploadStatus("idle");
    setUploadProgress(0);
    setStatusMessage("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    // Track real upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      setIsLoading(false);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);

          if (result.success) {
            setRecordCount(result.total_records);
            setUploadStatus("success");
            setStatusMessage(
              `Successfully uploaded ${result.total_records} records`
            );

            toast.success(
              `Batch created with ${result.total_records} records!`
            );

            // Pass preview + batch_id to next step
            setTimeout(() => {
              onUpload(result.batch_id);
            }, 1000);
          } else {
            throw new Error(result.error || "Upload failed");
          }
        } catch (err) {
          console.error("Response parse error:", err);
          setUploadStatus("error");
          setStatusMessage("Invalid response from server");
          toast.error("Failed to process upload");
        }
      } else {
        let errorMsg = "Upload failed";
        try {
          const err = JSON.parse(xhr.responseText);
          errorMsg = err.error || err.detail || errorMsg;
        } catch {}
        setUploadStatus("error");
        setStatusMessage(errorMsg);
        toast.error(errorMsg);
      }
    };

    xhr.onerror = () => {
      setIsLoading(false);
      setUploadStatus("error");
      setStatusMessage("Network error - please check connection");
      toast.error("Network error during upload");
    };

    xhr.open("POST", "/api/csv-parse");

    // Forward authentication token
    const token = localStorage.getItem("auth_token") || "";
    if (token) {
      xhr.setRequestHeader("Authorization", `Token ${token}`);
    }

    xhr.send(formData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h1 className="text-2xl font-bold">Upload Spreadsheet</h1>
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
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary"
            } ${isLoading ? "opacity-75 pointer-events-none" : ""}`}
          >
            <div className="flex flex-col items-center gap-4">
              {isLoading ? (
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 text-muted-foreground" />
              )}

              <div>
                <h3 className="text-lg font-semibold mb-1">
                  {isLoading ? "Uploading..." : "Drag & drop your CSV file"}
                </h3>
                {!isLoading && (
                  <>
                    <p className="text-muted-foreground text-sm mb-4">
                      or click to browse
                    </p>
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <input
                        id="csv-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="hidden"
                      />
                      <Button
                        disabled={isLoading}
                      >
                        Select File
                      </Button>
                    </label>
                  </>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Supported: CSV (.csv)
              </p>
            </div>
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="mt-6 space-y-2">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {uploadProgress}%{" "}
                {uploadProgress === 100 ? "Processing..." : "uploaded"}
              </p>
            </div>
          )}

          {/* Status */}
          {uploadStatus !== "idle" && !isLoading && (
            <div
              className={`mt-6 p-4 rounded-lg flex items-center gap-3 border ${
                uploadStatus === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {uploadStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Help Panel */}
        <div className="bg-card rounded-lg p-6 border h-fit">
          <h3 className="font-semibold mb-4">Getting Started</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-1">File Format</h4>
              <p className="text-muted-foreground">
                Upload CSV following the template structure.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Required Fields</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Recipient name & address</li>
                <li>City, State (2-letter), ZIP</li>
                <li>Order number</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Template</h4>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const csv = `From,,,,,,,To,,,,,,,weight*,weight*,Dimensions*,Dimensions*,Dimensions*,,,,
First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,First name*,Last name,Address*,Address2,City*,ZIP/Postal code*,Abbreviation*,lbs,oz,Length,width,Height,phone num1,phone num2,order no,Item-sku`;
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "Shipping_Template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Template
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
