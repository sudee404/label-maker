import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions as any)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex h-screen">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-8 md:p-12">{children}</main>
        </div>
  )
}
