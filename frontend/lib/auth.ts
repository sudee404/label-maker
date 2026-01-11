import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import api from "@/lib/axios";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },

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

          // Validate the shape
          if (!data?.access || !data?.refresh || !data?.user?.email) {
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

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        token.accessTokenExpires = Date.now() + 5 * 60 * 1000;
        return token;
      }

      // Subsequent calls: check if access token expired
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      console.log("[JWT] Access token expired, attempting refresh...");

      try {
        const refreshResponse = await api.post("/accounts/token/refresh/", {
          refresh: token.refreshToken,
        });

        const refreshed = refreshResponse.data;

        if (!refreshed?.access) {
          throw new Error("No new access token received");
        }

        return {
          ...token,
          accessToken: refreshed.access,
          refreshToken: refreshed.refresh || token.refreshToken,
          accessTokenExpires: Date.now() + 5 * 60 * 1000,
        };
      } catch (error: any) {
        console.error(
          "[JWT] Refresh token failed:",
          error?.response?.data || error
        );
        return { ...token, error: "RefreshTokenError" };
      }
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
