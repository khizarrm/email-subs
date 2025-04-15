"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const { data: session, status } = useSession()
  const [supabaseAccessToken, setSupabaseAccessToken] = useState<string | null>(null)

  // 🔁 Sync user on login
  useEffect(() => {
    const syncUser = async () => {
      if (session?.user?.email) {
        await fetch("/api/user/sync", { method: "POST" })
      }
    }

    syncUser()
  }, [session])

  // 🧾 Fetch Supabase access token
  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token ?? null
      setSupabaseAccessToken(token)

      console.log("Session status:", status)
      console.log("Session data:", session)
      console.log("NextAuth Access Token:", session?.accessToken)
      console.log("Supabase Access Token:", token)
    }

    fetchToken()
  }, [session, status])

  if (status === "loading") {
    return <div className="text-center p-24">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <p className="text-lg font-medium">
          Signed in as: <span className="font-bold">{session?.user?.email}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Supabase Token: {supabaseAccessToken?.slice(0, 10)}...
        </p>
        <Button onClick={() => signOut()} variant="outline" className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  )
}
