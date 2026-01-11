"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, Download, Printer as Print, Home } from "lucide-react"

interface SuccessScreenProps {
  recordCount: number
  totalPrice: number
  onNewWizard: () => void
}

export default function SuccessScreen({ recordCount, totalPrice, onNewWizard }: SuccessScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 max-w-2xl w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>

        <h1 className="text-3xl font-bold">Purchase Complete!</h1>

        <p className="text-muted-foreground">
          Your shipping labels have been successfully generated and are ready to use.
        </p>

        {/* Summary */}
        <div className="bg-muted/50 p-6 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span>Shipment Labels:</span>
            <span className="font-semibold">{recordCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-bold text-accent text-lg">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Confirmation #:</span>
            <span className="font-mono">INV-{Date.now().toString().slice(-8)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full gap-2 bg-accent hover:bg-accent/90">
            <Download className="w-4 h-4" />
            Download All Labels (PDF)
          </Button>

          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <Print className="w-4 h-4" />
            Print Labels
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={onNewWizard}>
            Create Another Shipment
          </Button>

          <Link href="/dashboard" className="flex-1">
            <Button variant="secondary" className="w-full gap-2">
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
