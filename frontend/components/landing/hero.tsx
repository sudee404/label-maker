import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col justify-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  Streamline Your Bulk Shipping
                </h1>
                <p className="text-lg text-muted-foreground sm:text-xl">
                  Manage thousands of shipments with enterprise-grade reliability. Save time, reduce costs, and scale
                  with confidence.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                  <Link href="#features">See How It Works</Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  Fast Setup
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  24/7 Support
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent" />
                  No Credit Card
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 sm:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-6 rounded-xl bg-card/80 p-6 backdrop-blur-sm sm:p-8">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">DAILY SHIPMENTS PROCESSED</p>
                  <p className="text-3xl font-bold text-foreground sm:text-4xl">50,000+</p>
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Processing</p>
                    <p className="mt-1 font-semibold text-foreground">2.3 min</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost Savings</p>
                    <p className="mt-1 font-semibold text-accent">47%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
