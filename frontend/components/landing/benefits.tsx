export default function Benefits() {
  const benefits = [
    {
      metric: "95%",
      description: "Faster order processing",
    },
    {
      metric: "40%",
      description: "Reduction in shipping costs",
    },
    {
      metric: "99.9%",
      description: "Uptime guarantee",
    },
    {
      metric: "5 min",
      description: "Average setup time",
    },
  ]

  return (
    <section id="benefits" className="border-t border-border bg-card/30 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Proven Results</h2>
          <p className="mt-4 text-lg text-muted-foreground">Trusted by leading logistics companies worldwide</p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="space-y-2 text-center">
              <p className="text-4xl font-bold text-accent sm:text-5xl">{benefit.metric}</p>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
