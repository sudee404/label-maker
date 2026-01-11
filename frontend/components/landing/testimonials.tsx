import { Star } from "lucide-react"

const testimonials = [
  {
    content:
      "BulkShip has completely transformed how we manage our shipping operations. The time savings alone have paid for itself multiple times over.",
    author: "Sarah Chen",
    role: "Operations Director at LogiCorp",
    rating: 5,
  },
  {
    content:
      "The integration with our existing systems was seamless. Support team was incredibly helpful throughout the process.",
    author: "Michael Rodriguez",
    role: "VP of Logistics at ShipFast Inc",
    rating: 5,
  },
  {
    content:
      "We've reduced our shipping errors by 99% since switching to BulkShip. Best decision we've made for our business.",
    author: "Emma Thompson",
    role: "CEO at Global Traders",
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by Industry Leaders
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">See what our customers have to say</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card/50 p-6">
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-4 text-foreground">"{testimonial.content}"</p>
              <div className="mt-4 border-t border-border pt-4">
                <p className="font-semibold text-foreground">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
