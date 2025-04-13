"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const { data: session } = useSession()

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

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Access Token:</h2>
        <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
          <pre className="text-xs break-all whitespace-pre-wrap">
            {(session as any)?.accessToken || "No access token available"}
          </pre>
        </div>
      </div>
    </div>
  )
}
