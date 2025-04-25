import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      const scopes = account?.scope?.split(" ") || []
      const hasGmailAccess = scopes.includes("https://www.googleapis.com/auth/gmail.readonly")
  
      if (!hasGmailAccess) {
        console.warn("⚠️ User denied Gmail access.")
        return '/auth/error'
      }

      return true
    },

    async jwt({ token, account, profile }) {
      // On initial sign-in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.email = profile?.email
        token.expiresAt = account.expires_at
        token.sub = account.providerAccountId // Google user ID
      }

      // Fetch Supabase user ID and attach it to the token
      if (!token.supabase_id) {
        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("auth_provider_id", token.sub)
          .maybeSingle()

        if (error) {
          console.error("❌ Failed to fetch Supabase user in JWT:", error)
        } else if (user) {
          console.log("✅ Found Supabase user in JWT:", user.id)
          token.supabase_id = user.id
        } else {
          console.warn("⚠️ No Supabase user found in JWT for sub:", token.sub)
        }
      }

      return token
    },

    async session({ session, token }) {
      console.log("📦 Injecting session for:", token.email)
      console.log("🔑 Google sub:", token.sub)
      console.log("🗂 Supabase user ID:", token.supabase_id)

      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,                  // Google ID
          email: token.email,
          supabase_id: token.supabase_id // UUID from Supabase
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      }
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
