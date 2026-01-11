"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useScroll } from "@/hooks/use-scroll"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const isScrolled = useScroll()

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "border-b border-border bg-background/95 backdrop-blur-sm"
          : "bg-gradient-to-b from-background to-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="text-sm font-bold text-accent-foreground">BS</span>
            </div>
            <span className="hidden font-bold text-foreground sm:inline">BulkShip</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#benefits" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Benefits
            </Link>
            <Link
              href="#testimonials"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Testimonials
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="text-foreground">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
