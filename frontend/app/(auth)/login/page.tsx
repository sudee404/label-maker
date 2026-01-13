import Link from "next/link"
import { SignInForm } from "@/components/signin-form"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export default async function LoginPage() {
  const session = await getServerSession(authOptions as any)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ShipHub</h1>
          <p className="text-slate-400">Unified logistics management platform</p>
        </div>

        <SignInForm />

        <p className="text-center text-white/70 mt-6">
          Don{"'"}t have an account?{" "}
          <Link href="/register" className="text-accent font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
