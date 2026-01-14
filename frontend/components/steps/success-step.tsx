"use client";

import { CheckCircle2, Download, LoaderCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useRef } from "react";

interface ShipmentRecord {
  id: string;
}

interface SuccessStepProps {
  batch: string | number;
  data: any;
  labelSize: "letter" | "4x6";
  onReset: () => void;
}

export function SuccessStep({
  batch,
  data,
  labelSize,
  onReset,
}: SuccessStepProps) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Shared fetch logic
  const fetchLabels = async () => {
    const response = await fetch(`/api/batches/${batch}/download`, {
      method: "GET",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to fetch labels (${response.status})`
      );
    }

    return await response.blob();
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    toast(
      <div className="space-y-2">
        <p className="font-medium">Preparing your labels...</p>
        <p className="text-sm text-muted-foreground">
          {data?.count} shipping label{data?.count !== 1 ? "s" : ""} in{" "}
          {labelSize === "letter" ? "Letter/A4" : "4x6"} format
        </p>
      </div>
    );

    try {
      const blob = await fetchLabels();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shipping-labels-batch-${batch}.pdf`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Downloaded ${data?.count} label${
          data?.count !== 1 ? "s" : ""
        } successfully!`
      );
    } catch (err: any) {
      console.error("Download failed:", err);
      toast.error(err.message || "Failed to download shipping labels");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);

    toast(
      <div className="space-y-2">
        <p className="font-medium">Preparing to print labels...</p>
        <p className="text-sm text-muted-foreground">
          {data?.count} label{data?.count !== 1 ? "s" : ""} •{" "}
          {labelSize === "letter" ? "Letter/A4" : "4x6"}
        </p>
      </div>
    );

    try {
      const blob = await fetchLabels();
      const url = window.URL.createObjectURL(blob);

      // Create or reuse hidden iframe
      if (!iframeRef.current) {
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.opacity = "0";
        iframe.style.pointerEvents = "none";
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
      }

      const iframe = iframeRef.current!;

      iframe.onload = () => {
        try {
          setTimeout(() => {
            iframe.focus();
            iframe.contentWindow?.print();
            toast.success("Print dialog opened – ready to print labels!");
          }, 800); // ← give PDF renderer time (increase to 1200-1500ms if labels cut off)
        } catch (e) {
          console.warn("Print failed from iframe", e);
          toast.warning(
            "Print dialog could not be opened automatically. Try downloading instead."
          );
        }
      };

      iframe.src = url;

      // Optional: clean up after some time (but keep url alive during print)
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 30000);
    } catch (err: any) {
      console.error("Print preparation failed:", err);
      toast.error(err.message || "Failed to prepare labels for printing");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div>
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
                {data?.count ?? 0}
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
        {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Button
          size="lg"
          className="gap-2"
          disabled={downloading}
          onClick={handleDownload}
        >
          {downloading ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Labels
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          disabled={printing}
          onClick={handlePrint}
        >
          {printing ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin mr-2" />
              Preparing...
            </>
          ) : (
            <>
              <Printer className="w-4 h-4 mr-2" />
              Print Now
            </>
          )}
        </Button>

        <Button
          className="bg-green-600 hover:bg-green-700"
          size="lg"
          onClick={onReset}
        >
          Create New Batch
        </Button>
      </div>

        {/* Next Steps */}
        <div className="bg-muted/50 rounded-lg p-6 text-left">
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
      </div>
    </div>
  );
}
