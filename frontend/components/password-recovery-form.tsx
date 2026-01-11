"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { passwordRecoverySchema, type PasswordRecoveryInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PasswordRecoveryForm() {
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordRecoveryInput>({
    resolver: zodResolver(passwordRecoverySchema),
  })

  async function onSubmit(data: PasswordRecoveryInput) {
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || "Failed to send recovery email")
        return
      }

      setSuccess(true)
      reset()
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive password recovery instructions</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <Alert className="border-green-600 bg-green-50">
              <AlertDescription className="text-green-800">
                Recovery email sent! Check your inbox for instructions to reset your password.
              </AlertDescription>
            </Alert>
            <Button asChild className="w-full bg-transparent" variant="outline">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <Input id="email" type="email" placeholder="your@email.com" {...register("email")} disabled={isLoading} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Recovery Email"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
