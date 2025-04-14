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
        
        {!session && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6 text-sm">
            <p className="font-medium mb-2">🔒 Your data is safe</p>
            <p>I only store your email address and subscription preferences. Your Gmail data is never stored permanently - just scanned temporarily to find your subscriptions.</p>
            
            <details className="mt-3 cursor-pointer">
              <summary className="font-medium text-gray-700 hover:text-gray-900">How does it work?</summary>
              <div className="mt-2 pl-2 border-l-2 border-gray-200">
              <p>
                When a user logs in with Google, they grant the app read-only access to their Gmail inbox. Once logged in, the app scans their recent emails using the Gmail API by calling the <code>/api/gmail/scan</code> endpoint. Each email body is then sent to OpenAI to extract details like the vendor name, billing amount, and currency. The parsed data is saved in Supabase under the <code>subscriptions</code> and <code>emails</code> tables. On the frontend, users are shown a clean summary of their recurring charges. Every 30 days, a summary email is automatically sent to them with their subscription activity.
                </p>
              </div>
            </details>
            
            <div className="mt-4 text-center">
              <a 
                href="https://github.com/khizarrm/email-subs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-gray-600 hover:text-black transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>Check out the code on GitHub</span>
              </a>
            </div>
          </div>
        )}
        
        {session ? <Dashboard /> : <LoginButton />}
      </div>
    </main>
  )
}