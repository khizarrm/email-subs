"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const { data: session, status } = useSession()

  // 🔁 Call backend to sync user on first load
  useEffect(() => {
    const syncUser = async () => {
      if (session?.user?.email) {
        await fetch("/api/user/sync", {
          method: "POST",
        })
      }
    }

    syncUser()
  }, [session])

  if (status === "loading") {
    return <div className="text-center p-24">Loading...</div>
  }

  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
  }, [session, status])
  

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center space-y-2">
        <p className="text-lg font-medium">
          Signed in as: <span className="font-bold">{session?.user?.email}</span>
        </p>
        <Button onClick={() => signOut()} variant="outline" className="w-full">
          Sign out
        </Button>
      </div>
    </div>
  )
}
