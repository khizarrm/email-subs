"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LoginButton() {
  return (
    <div className="flex flex-col items-center space-y-4">
      <Button onClick={() => signIn("google")} className="w-full">
        Sign in with Google
      </Button>
    </div>
  )
}
