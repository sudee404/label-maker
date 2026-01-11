import { Package, BarChart3, Clock, Shield, Zap, Users } from "lucide-react"

const features = [
  {
    name: "Bulk Operations",
    description: "Create, update, and manage thousands of shipments simultaneously with our powerful bulk tools.",
    icon: Package,
  },
  {
    name: "Real-Time Analytics",
    description: "Track shipment performance with comprehensive dashboards and custom reports.",
    icon: BarChart3,
  },
  {
    name: "Automated Workflows",
    description: "Set up rules and automations to reduce manual work and increase efficiency.",
    icon: Zap,
  },
  {
    name: "Live Tracking",
    description: "Keep tabs on every shipment with real-time status updates and notifications.",
    icon: Clock,
  },
  {
    name: "Enterprise Security",
    description: "Bank-level encryption and compliance standards protect your data.",
    icon: Shield,
  },
  {
    name: "Team Collaboration",
    description: "Invite team members, set permissions, and work together seamlessly.",
    icon: Users,
  },
]

export default function Features() {
  return (
    <section id="features" className="border-t border-border px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">Comprehensive tools designed for shipping professionals</p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.name}
                className="rounded-xl border border-border bg-card/50 p-6 transition-all hover:border-accent hover:bg-card"
              >
                <Icon className="h-10 w-10 text-accent" />
                <h3 className="mt-4 font-semibold text-foreground">{feature.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
