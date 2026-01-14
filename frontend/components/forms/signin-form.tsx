"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoaderCircle } from "lucide-react"

export function SignInForm() {
  const router = useRouter()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors,isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setError("")
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else if (result?.ok) {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" type="email" placeholder="your@email.com" defaultValue={"demo@shiphub.com"} {...register("email")} disabled={isSubmitting} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              defaultValue={"ChangeMe123!"} 
              placeholder="••••••••"
              {...register("password")}
              disabled={isSubmitting}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ?  (
              <span className="flex items-center justify-center gap-2">
                <LoaderCircle className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-sm">
          <div className="text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-orange-600 hover:text-orange-700">
              Sign up
            </Link>
          </div>
          <div className="text-center">
            <Link href="/forgot-password" className="font-semibold text-orange-600 hover:text-orange-700">
              Forgot password?
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
