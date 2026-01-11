import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Django",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch("http://localhost:8000/api/login/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.error("[v0] Django auth failed:", response.status)
            return null
          }

          const data = await response.json()

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          }
        } catch (error) {
          console.error("[v0] Auth error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    },
  },
}
