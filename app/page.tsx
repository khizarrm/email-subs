"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { LoginButton } from "@/components/login-button"
import { UserProfile } from "@/components/user-profile"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const { data: session } = useSession()

  // ✅ Automatically sync user after login
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/sync", { method: "POST" }).catch((err) =>
        console.error("User sync failed", err)
      )
    }
  }, [session?.user?.id])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-3xl font-bold text-center">subtrack - google auth</h1>
        {session ? <Dashboard /> : <LoginButton />}
      </div>
    </main>
  )
}
