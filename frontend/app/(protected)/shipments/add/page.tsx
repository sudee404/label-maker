"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Step1Upload from "@/components/wizard/step1-upload"
import Step2Review from "@/components/wizard/step2-review"
import Step3Shipping from "@/components/wizard/step3-shipping"
import Step4Checkout from "@/components/wizard/step4-checkout"
import SuccessScreen from "@/components/wizard/success-screen"

export interface ShipmentRecord {
  id: string
  shipFrom: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  shipTo: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  package: {
    weight: number
    length: number
    width: number
    height: number
    description: string
  }
  orderNumber: string
  validation: {
    isValid: boolean
    errors: string[]
  }
}

export interface WizardState {
  records: ShipmentRecord[]
  selectedShippingService: { [key: string]: "priority" | "ground" | null }
  labelSize: "letter" | "a4" | "4x6"
}

export default function ShippingWizardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardState, setWizardState] = useState<WizardState>({
    records: [],
    selectedShippingService: {},
    labelSize: "4x6",
  })
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!session) return null

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePurchase = () => {
    setShowSuccess(true)
  }

  const handleNewWizard = () => {
    setCurrentStep(1)
    setWizardState({
      records: [],
      selectedShippingService: {},
      labelSize: "4x6",
    })
    setShowSuccess(false)
  }

  if (showSuccess) {
    return (
      <div className="w-full">
        <SuccessScreen
          recordCount={wizardState.records.length}
          totalPrice={wizardState.records.length * 5.99}
          onNewWizard={handleNewWizard}
        />
      </div>
    )
  }

  const stepTitles = ["Upload Spreadsheet", "Review & Edit", "Select Shipping", "Checkout"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bulk Shipping Wizard</h1>
        <p className="text-muted-foreground">
          Step {currentStep} of 4: {stepTitles[currentStep - 1]}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${step <= currentStep ? "bg-accent" : "bg-muted"}`}
              style={{ width: step <= currentStep ? "100%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Alert */}
      {currentStep === 1 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Upload a CSV file with shipping information. Maximum 1000 rows per file.</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <Card className="border-border/50 p-6">
        {currentStep === 1 && (
          <Step1Upload
            onRecordsLoaded={(records) => {
              setWizardState((prev) => ({ ...prev, records }))
              handleNext()
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Review
            records={wizardState.records}
            onRecordsUpdated={(records) => {
              setWizardState((prev) => ({ ...prev, records }))
            }}
          />
        )}

        {currentStep === 3 && (
          <Step3Shipping
            records={wizardState.records}
            selectedServices={wizardState.selectedShippingService}
            onServiceSelected={(recordId, service) => {
              setWizardState((prev) => ({
                ...prev,
                selectedShippingService: {
                  ...prev.selectedShippingService,
                  [recordId]: service,
                },
              }))
            }}
          />
        )}

        {currentStep === 4 && (
          <Step4Checkout
            recordCount={wizardState.records.length}
            labelSize={wizardState.labelSize}
            totalPrice={wizardState.records.length * 5.99}
            onLabelSizeChange={(size) => {
              setWizardState((prev) => ({ ...prev, labelSize: size }))
            }}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex gap-4 justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 1}>
          Previous
        </Button>

        {currentStep < 4 ? (
          <Button onClick={handleNext} disabled={wizardState.records.length === 0} className="gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handlePurchase} className="gap-2 bg-accent hover:bg-accent/90">
            Complete Purchase
          </Button>
        )}
      </div>
    </div>
  )
}
