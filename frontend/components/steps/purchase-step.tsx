"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Info, AlertCircle } from "lucide-react";
import axios from "axios";

interface ShipmentRecord {
  id: string;
  price?: number;
}

interface PurchaseStepProps {
  batch: any;
  data: {
    count: number;
    total_prices: number | string; // base shipping cost
    currency?: string; // optional
  };
  labelSize: "letter" | "4x6";
  onLabelSizeChange: (size: "letter" | "4x6") => void;
  onPurchase: () => void;
  onBack: () => void;
}

export function PurchaseStep({
  batch,
  data,
  labelSize,
  onLabelSizeChange,
  onPurchase,
  onBack,
}: PurchaseStepProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Safeguard & better typing
  const shipmentCount = data?.count ?? 0;
  const baseShippingCost = Number(data?.total_prices ?? 0);
  const labelPricePerUnit = 0.5;
  const labelCost = shipmentCount * labelPricePerUnit;

  const grandTotal = baseShippingCost + labelCost;

  const currency = data?.currency ?? "$";

  const formatPrice = (amount: number) => `${currency}${amount.toFixed(2)}`;

  const handlePurchase = async () => {
    if (!agreeTerms) {
      toast.error("You must agree to the terms and conditions to continue");
      return;
    }
    if (shipmentCount === 0) {
      toast.error("No shipments selected for purchase");
      return;
    }
    await axios
      .post(`/api/batches/${batch}/purchase`, {
        label_format: labelSize,
        total_price: grandTotal,
      })
      .then(() => {
        toast.success("Purchase successful, You can now download labels")
        onPurchase();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error making purchase");
      }).finally(() => {
        
      })
  };

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left - Main content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Label Format Selection */}
          <div className="bg-card border shadow-sm rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
              <span>Label Format</span>
              <span className="text-xs font-normal px-2.5 py-1 bg-muted rounded-full">
                Required
              </span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  id: "letter",
                  name: "Letter / A4",
                  desc: '8.5" × 11" – standard office / home printer',
                  icon: "📄",
                },
                {
                  id: "4x6",
                  name: "4×6 Thermal",
                  desc: '4" × 6" – thermal label printer (recommended)',
                  icon: "🏷️",
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`
                    flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all
                    ${
                      labelSize === option.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{option.icon}</div>
                    <input
                      type="radio"
                      name="labelSize"
                      value={option.id}
                      checked={labelSize === option.id}
                      onChange={(e) =>
                        onLabelSizeChange(e.target.value as "letter" | "4x6")
                      }
                      className="w-5 h-5 accent-primary cursor-pointer"
                    />
                  </div>
                  <p className="font-medium">{option.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-card border shadow-sm rounded-xl p-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-5 h-5 mt-1 accent-primary cursor-pointer"
              />
              <div className="space-y-2">
                <p className="text-base font-medium group-hover:underline">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Shipping labels are digital, non-refundable products. By
                  continuing you acknowledge that once purchased, labels cannot
                  be cancelled or refunded.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Right - Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-card border shadow-sm rounded-xl p-6 lg:sticky lg:top-6">
            <h3 className="font-semibold text-lg mb-6">Order Summary</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Number of Shipments
                </span>
                <span className="font-medium">{shipmentCount}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Base Shipping Cost
                </span>
                <span className="font-medium">
                  {formatPrice(baseShippingCost)}
                </span>
              </div>

              <div className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Label Fees</span>
                  <span className="text-xs text-muted-foreground">
                    (0.50 each)
                  </span>
                </div>
                <span className="font-medium">{formatPrice(labelCost)}</span>
              </div>
            </div>

            <div className="pt-5 border-t">
              <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-semibold">Total Amount</span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(grandTotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                All charges are final • No refunds on labels
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Button
                className="w-full text-base py-6"
                size="lg"
                disabled={!agreeTerms || shipmentCount === 0}
                onClick={handlePurchase}
              >
                Complete Purchase • {formatPrice(grandTotal)}
              </Button>

              <Button variant="outline" className="w-full" onClick={onBack}>
                Back to Previous Step
              </Button>
            </div>

            {!agreeTerms && (
              <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                <AlertCircle size={16} />
                <span>Please agree to the terms to continue</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
