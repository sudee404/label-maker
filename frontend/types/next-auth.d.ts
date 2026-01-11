import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    accessToken: string
    refreshToken: string
  }

  interface Session extends DefaultSession {
    user: {
      id: string
    } & DefaultSession["user"]
    accessToken: string
    refreshToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    accessToken: string
    refreshToken: string
  }
}
