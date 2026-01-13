"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShipmentRecord {
  id: string;
  shippingPrice?: number;
}

interface PurchaseStepProps {
  records: ShipmentRecord[];
  labelSize: "letter" | "4x6";
  onLabelSizeChange: (size: "letter" | "4x6") => void;
  onPurchase: () => void;
  onBack: () => void;
}

export function PurchaseStep({
  records,
  labelSize,
  onLabelSizeChange,
  onPurchase,
  onBack,
}: PurchaseStepProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);

  const grandTotal = records.reduce(
    (sum, record) => sum + (record.shippingPrice || 0),
    0
  );
  const labelCost = records.length * 0.5; // $0.50 per label

  const handlePurchase = () => {
    if (!agreeTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    onPurchase();
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
            4
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Purchase & Checkout
          </h1>
        </div>
        <p className="text-muted-foreground">
          Final step • Review and complete your order
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Label Size Selection */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Select Label Format
            </h3>
            <div className="space-y-3">
              {[
                {
                  id: "letter",
                  name: "Letter/A4",
                  desc: 'Standard paper size (8.5" x 11")',
                },
                {
                  id: "4x6",
                  name: "4x6 Thermal",
                  desc: 'Thermal label format (4" x 6")',
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="labelSize"
                    value={option.id}
                    checked={labelSize === option.id}
                    onChange={(e) => {
                      onLabelSizeChange(e.target.value as "4x6" | "letter");
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <p className="font-medium text-foreground">{option.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {option.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="bg-card border border-border rounded-lg p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                }}
                className="w-4 h-4 mt-1 cursor-pointer"
              />
              <div>
                <p className="text-sm text-foreground">
                  I agree to the{" "}
                  <span className="font-medium underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-medium underline">Privacy Policy</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  By purchasing, you agree to our shipping terms and acknowledge
                  that labels are non-refundable.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card border border-border rounded-lg p-6 h-fit">
          <h3 className="font-semibold text-foreground mb-6">Order Summary</h3>

          <div className="space-y-4 mb-6 pb-6 border-b border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipments</span>
              <span className="font-medium text-foreground">
                {records.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping Cost</span>
              <span className="font-medium text-foreground">
                ${(grandTotal - labelCost).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Label Format</span>
              <span className="font-medium text-foreground">
                ${labelCost.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold text-foreground">Grand Total</span>
            <span className="text-2xl font-bold text-primary">
              ${(grandTotal + labelCost).toFixed(2)}
            </span>
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90"
            disabled={!agreeTerms}
            onClick={handlePurchase}
            size="lg"
          >
            Complete Purchase
          </Button>

          <Button
            variant="outline"
            className="w-full mt-3 bg-transparent"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
