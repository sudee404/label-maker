import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SignInForm } from "@/components/signin-form"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your bulk shipping platform account",
}

export default async function SignInPage() {
  const session = await getServerSession(authOptions as any)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Bulk Shipping</h1>
          <p className="text-slate-400">Unified logistics management platform</p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
