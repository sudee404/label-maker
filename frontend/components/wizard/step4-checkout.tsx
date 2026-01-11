"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"

interface Step4CheckoutProps {
  recordCount: number
  labelSize: "letter" | "a4" | "4x6"
  totalPrice: number
  onLabelSizeChange: (size: "letter" | "a4" | "4x6") => void
}

export default function Step4Checkout({ recordCount, labelSize, totalPrice, onLabelSizeChange }: Step4CheckoutProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipments:</span>
            <span className="font-semibold">{recordCount} labels</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per label:</span>
            <span className="font-semibold">$5.99</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between text-lg">
            <span className="font-semibold">Total:</span>
            <span className="font-bold text-accent">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Label Size */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Select Label Size</Label>
        <RadioGroup value={labelSize} onValueChange={(value: any) => onLabelSizeChange(value)}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="4x6" id="4x6" />
            <Label htmlFor="4x6" className="cursor-pointer flex-1">
              4x6 Thermal (Standard - Recommended)
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="letter" id="letter" />
            <Label htmlFor="letter" className="cursor-pointer flex-1">
              8.5x11 Letter
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="a4" id="a4" />
            <Label htmlFor="a4" className="cursor-pointer flex-1">
              A4 (210x297mm)
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Terms */}
      <div className="flex items-start space-x-2 p-4 bg-muted/50 rounded-lg">
        <Checkbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
        />
        <Label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed">
          I agree to the terms and conditions and understand that all shipments will be processed immediately upon
          purchase. Labels will be available for download and printing.
        </Label>
      </div>

      {/* Info */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <p className="text-sm text-muted-foreground">
          Once you complete this purchase, your shipping labels will be generated and ready to download. You'll receive
          a confirmation email with all details and a link to access your labels.
        </p>
      </Card>
    </div>
  )
}
