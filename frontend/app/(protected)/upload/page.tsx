"use client";

import { useState } from "react";
import { UploadStep } from "@/components/steps/upload-step";
import { ReviewStep } from "@/components/steps/review-step";
import { ShippingStep } from "@/components/steps/shipping-step";
import { PurchaseStep } from "@/components/steps/purchase-step";
import { SuccessStep } from "@/components/steps/success-step";
import type { ShipmentRecord } from "@/lib/schemas";
import { toast } from "sonner";

type Step = "upload" | "review" | "shipping" | "purchase" | "success";

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [records, setRecords] = useState<ShipmentRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [labelSize, setLabelSize] = useState<"letter" | "4x6">("4x6");
  const [savedAddresses, setSavedAddresses] = useState<
    Record<string, ShipmentRecord["shipFrom"]>
  >({
    default: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main St",
      address2: "Suite 100",
      city: "New York",
      zip: "10001",
      state: "NY",
      phone: "555-123-4567",
    },
  });
  const [savedPackages, setSavedPackages] = useState<
    Record<string, ShipmentRecord["package"]>
  >({
    standard: {
      length: 12,
      width: 8,
      height: 6,
      lbs: 2,
      oz: 0,
      sku: "STD-001",
    },
  });

  const handleUpload = (records: ShipmentRecord[]) => {
    setRecords(records);
    setCurrentStep("review");
    toast.success("Upload complete! Ready to review records.");
  };

  const handleNavigateBack = (targetStep: Step) => {
    if (currentStep === "review" && targetStep === "upload") {
      toast((t) => (
        <div className="space-y-3">
          <p className="font-medium">Going back will lose your current data</p>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to proceed?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentStep(targetStep);
                setRecords([]);
                setSelectedRows(new Set());
                toast.dismiss(t);
              }}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
            >
              Continue
            </button>
            <button
              onClick={() => toast.dismiss(t)}
              className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </div>
      ));
    } else {
      setCurrentStep(targetStep);
    }
  };

  const handleUpdateRecords = (updated: ShipmentRecord[]) => {
    setRecords(updated);
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setRecords([]);
    setSelectedRows(new Set());
    toast.success("Ready to upload a new batch!");
  };

  return (
    <>
      {currentStep === "upload" && <UploadStep onUpload={handleUpload} />}
      {currentStep === "review" && (
        <ReviewStep
          records={records}
          onUpdate={handleUpdateRecords}
          onContinue={() => setCurrentStep("shipping")}
          onBack={() => handleNavigateBack("upload")}
          selectedRows={selectedRows}
          onSelectRows={setSelectedRows}
          savedAddresses={savedAddresses}
          savedPackages={savedPackages}
        />
      )}
      {currentStep === "shipping" && (
        <ShippingStep
          records={records}
          onUpdate={handleUpdateRecords}
          onContinue={() => setCurrentStep("purchase")}
          onBack={() => setCurrentStep("review")}
          selectedRows={selectedRows}
          onSelectRows={setSelectedRows}
        />
      )}
      {currentStep === "purchase" && (
        <PurchaseStep
          records={records}
          labelSize={labelSize}
          onLabelSizeChange={setLabelSize}
          onPurchase={() => setCurrentStep("success")}
          onBack={() => setCurrentStep("shipping")}
        />
      )}
      {currentStep === "success" && (
        <SuccessStep
          records={records}
          labelSize={labelSize}
          onReset={handleReset}
        />
      )}
    </>
  );
}
