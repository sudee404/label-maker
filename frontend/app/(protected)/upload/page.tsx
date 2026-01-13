"use client";

import { useState } from "react";
import { UploadStep } from "@/components/steps/upload-step";
import { ReviewStep } from "@/components/steps/review-step";
import { ShippingStep } from "@/components/steps/shipping-step";
import { PurchaseStep } from "@/components/steps/purchase-step";
import { SuccessStep } from "@/components/steps/success-step";
import type { ShipmentRecord } from "@/lib/schemas";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type Step = "upload" | "review" | "shipping" | "purchase" | "success";

export default function Dashboard() {
  const [currentStep, setCurrentStep] = useState<Step>("upload");
  const [batch, setBatch] = useState<String | undefined>();

  const [records, setRecords] = useState<ShipmentRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [labelSize, setLabelSize] = useState<"letter" | "4x6">("4x6");

  const savedAddresses = useQuery({
    queryKey: ["addresses"],
    queryFn: async () =>
      await axios
        .get("/api/addresses", { params: { saved: true } })
        .then((res) => res?.data),
  });

  const savedPackages = useQuery({
    queryKey: ["packages"],
    queryFn: async () =>
      await axios
        .get("/api/packages", { params: { saved: true } })
        .then((res) => res?.data),
  });

  const { data: { data: shipments = [] } = {} } = useQuery({
    queryKey: ["shipments", `${batch}`],
    queryFn: async () =>
      await axios
        .get("/api/shipments", { params: { batch: batch } })
        .then((res) => res?.data),
    // enabled: !!batch,
  });

  const handleUpload = (batch: String) => {
    setBatch(batch);
    setCurrentStep("review");
  };

  const handleNavigateBack = (targetStep: Step) => {
    if (currentStep === "review" && targetStep === "upload") {
      toast(
        <div className="space-y-3">
          <p className="font-medium">Going back will lose your current data</p>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to proceed?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentStep(targetStep);
                // delete batch
                setRecords([]);
                setSelectedRows(new Set());
                toast.dismiss();
              }}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive/90"
            >
              Continue
            </button>
            <button
              onClick={() => toast.dismiss()}
              className="px-3 py-1 bg-muted text-muted-foreground rounded text-sm hover:bg-muted/80"
            >
              Cancel
            </button>
          </div>
        </div>
      );
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
  };
  console.log(shipments);
  return (
    <>
      {currentStep === "upload" && <UploadStep onUpload={handleUpload} />}
      {currentStep === "review" && (
        <ReviewStep
          records={shipments?.results}
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
