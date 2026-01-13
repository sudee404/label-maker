"use client";

import { CheckCircle2, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShipmentRecord {
  id: string;
}

interface SuccessStepProps {
  records: ShipmentRecord[];
  labelSize: "letter" | "4x6";
  onReset: () => void;
}

export function SuccessStep({ records, labelSize, onReset }: SuccessStepProps) {
  const handleDownload = () => {
    toast(
      <div className="space-y-2">
        <p className="font-medium">Downloading labels...</p>
        <p className="text-sm text-muted-foreground">
          Your {records.length} shipping label{records.length > 1 ? "s" : ""} (
          {labelSize === "letter" ? "Letter" : "4x6"}) are being prepared
        </p>
      </div>
    );

    setTimeout(() => {
      toast.success(`Downloaded ${records.length} shipping label(s) as PDF`);
    }, 1500);
  };

  const handlePrint = () => {
    toast(
      <div className="space-y-2">
        <p className="font-medium">Opening print dialog...</p>
        <p className="text-sm text-muted-foreground">
          Prepare your printer and select the correct label size (
          {labelSize === "letter" ? "8.5×11 inches" : "4×6 inches"})
        </p>
      </div>
    );

    setTimeout(() => {
      window.print();
      toast.success("Print dialog opened");
    }, 1000);
  };

  const handleReset = () => {
    toast.success("Ready to create a new batch!");
    onReset();
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="text-center py-16">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Order Complete!
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your shipping labels have been created successfully.
        </p>

        {/* Summary */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8 text-left">
          <h3 className="font-semibold text-foreground mb-6">Order Summary</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">
                Total Labels Created
              </span>
              <span className="font-bold text-lg text-foreground">
                {records.length}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-muted-foreground">Label Format</span>
              <span className="font-medium text-foreground">
                {labelSize === "letter" ? "Letter/A4" : "4x6 Thermal"}
              </span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground">Status</span>
              <span className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                Ready to Print
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" className="gap-2" onClick={handleDownload}>
            <Download className="w-4 h-4" />
            Download Labels
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4" />
            Print Labels
          </Button>
        </div>

        {/* Next Steps */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
          <h4 className="font-semibold text-foreground mb-3">What's Next?</h4>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Download or print your labels</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>Attach labels to your packages</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Drop off packages at your carrier location</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Track your shipments from your account</span>
            </li>
          </ol>
        </div>

        <Button
          className="bg-primary hover:bg-primary/90"
          size="lg"
          onClick={handleReset}
        >
          Create New Batch
        </Button>
      </div>
    </div>
  );
}
