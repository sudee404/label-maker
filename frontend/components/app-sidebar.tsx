"use client"

import { signOut, useSession } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, BarChart3, Settings, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/shipments", label: "Shipments", icon: Package },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="md:hidden fixed top-4 left-4 z-50">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed md:relative w-64 h-screen bg-gradient-to-b from-primary to-primary-dark text-primary-foreground p-6 transition-all md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <Package className="w-8 h-8" />
            <span className="text-xl font-bold">Unified Logistics</span>
          </Link>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/20 pt-4 space-y-3">
            <div className="px-4 py-2">
              <p className="text-sm font-medium">{session?.user?.email}</p>
              <p className="text-xs text-white/60">{session?.user?.name}</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
