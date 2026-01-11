import type { Metadata } from "next"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { SignUpForm } from "@/components/signup-form"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new bulk shipping platform account",
}

export default async function SignUpPage() {
  const session = await getServerSession(authOptions as any)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Bulk Shipping</h1>
          <p className="text-slate-400">Create your account to get started</p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
