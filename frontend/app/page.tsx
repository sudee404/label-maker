"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navbar from "@/components/landing/navbar"
import Hero from "@/components/landing/hero"
import Features from "@/components/landing/features"
import Benefits from "@/components/landing/benefits"
import Testimonials from "@/components/landing/testimonials"
import CTA from "@/components/landing/cta"
import Footer from "@/components/landing/footer"

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push("/dashboard")
    }
  }, [session, router])

  if (session) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <Navbar />
      <Hero />
      <Features />
      <Benefits />
      <Testimonials />
      <CTA />
      <Footer />
    </main>
  )
}
