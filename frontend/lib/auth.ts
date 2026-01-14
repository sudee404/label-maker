import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import api from "@/lib/axios";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 24 * 60 * 60, // 1 day
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
          return null;
        }

        try {
          const response = await api.post("/accounts/login/", {
            email: credentials.email,
            password: credentials.password,
          });

          const data = response.data;

          if (!data?.access || !data?.user?.email) {
            console.error("[AUTH] Invalid login response from Django");
            return null;
          }

          return {
            id: data.user.email,
            email: data.user.email,
            name: data.user.full_name || data.user.email.split("@")[0],
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        } catch (error: any) {
          console.error(
            "[AUTH] Django login failed:",
            error?.response?.data || error.message
          );
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Only run on initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.accessToken = token.accessToken as string;
      }

      return session;
    },
  },
};