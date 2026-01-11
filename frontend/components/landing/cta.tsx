import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CTA() {
  return (
    <section className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready to Transform Your Shipping?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Join thousands of companies saving time and money with BulkShip. Start your free trial today, no credit card
          required.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="mailto:contact@bulkship.io">Contact Sales</Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">No credit card required. Set up in 5 minutes.</p>
      </div>
    </section>
  )
}
