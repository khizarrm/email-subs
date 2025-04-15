"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"

export function Dashboard() {
  const { data: session } = useSession()

  console.log("Logged in as:", session?.user?.email)
  
  if (!session) {
    console.error("bro has no session") // or loading spinner
  }
  
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<any[] | null>(null)
  const [feedback, setFeedback] = useState("")
  const [noRecords, setNoRecords] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const toggleExpand = (index: number) => {
    setExpanded(prev => {
      const newSet = new Set(prev)
      newSet.has(index) ? newSet.delete(index) : newSet.add(index)
      return newSet
    })
  }

  const handleScan = async () => {
    console.log("Handling scan...")
    setLoading(true)
    setFeedback("")
    setNoRecords(false)
  
    // Step 1: Fetch from /api/gmail/scan
    console.log("Calling /api/gmail/scan")
    const res = await fetch("/api/gmail/scan", {
      method: "GET",
      credentials: "include",
    })
  
    console.log("Recieived response:", res)
    const data = await res.json()
    console.log("Parsed data:", data)
  
    // Step 2: Check if any messages were returned
    if (!data.messages || data.messages.length === 0) {
      setPurchases([])
      setNoRecords(true)
      setLoading(false)
      return
    }
  
    // Step 3: POST messages to Supabase Edge Function
    console.log("Posting to Supabase Edge Function...")
    const supabaseRes = await fetch("https://<your-project-id>.functions.supabase.co/gmail-parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages: data.messages }),
    })
  
    const supabaseData = await supabaseRes.json()
    console.log("📦 Supabase parse response:", supabaseData)
  
    // Step 4: Refresh local display (or let DB listener take over)
    // Optional: call /api/subscriptions or re-fetch `purchases`
    await fetchAndUpdatePurchases()
  
    setLoading(false)
  }
  

  const handleSubscribe = async () => {
    setLoading(true)
    setFeedback("")

    const res = await fetch("/api/user/subscribe", {
      method: "POST",
    })

    if (res.ok) {
      setSubscribed(true)
      setFeedback("🎉 You're now subscribed to monthly email summaries.")
    } else {
      setFeedback("⚠️ Something went wrong. Try again.")
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6 w-full max-w-xl text-center mx-auto">
      <div className="space-y-3">
        <Button
          onClick={handleSubscribe}
          disabled={loading || subscribed}
          className="w-full"
        >
          {subscribed ? "Subscribed!" : "Subscribe to Monthly Email"}
        </Button>

        <Button onClick={handleScan} disabled={loading} className="w-full">
          {loading ? "Scanning..." : "Try it"}
        </Button>

        {feedback && (
          <p className="text-green-600 font-medium animate-pulse">{feedback}</p>
        )}
      </div>

      {/* Added disclaimer message */}
      <div className="text-amber-600 text-sm italic border border-amber-300 bg-amber-50 p-3 rounded-md">
        Data here isn't 100% accurate. You might see some discrepancies. Currently working on that, will be fixed soon.
      </div>

      {noRecords && (
        <p className="text-red-600 mt-6 text-center font-medium">
          🚫 No records found in your Gmail from the past 30 days.
        </p>
      )}

      {purchases && purchases.length > 0 && (
        <>
          <h2 className="text-2xl font-semibold mt-8">Summary of Purchases</h2>
          <ul className="space-y-4 text-left">
            {purchases.map((p, i) => (
              <li key={i} className="border rounded-lg p-4 shadow-sm">
                <p><strong>Vendor:</strong> {p.vendor_name || "Unknown"}</p>
                <p><strong>Price:</strong> {p.amount} {p.currency}</p>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => toggleExpand(i)}
                >
                  {expanded.has(i) ? "Hide Details" : "Show More Details"}
                </Button>

                {expanded.has(i) && (
                  <div className="mt-4 text-sm text-gray-700 space-y-1">
                    <p><strong>Date:</strong> {new Date(p.date).toLocaleDateString()}</p>
                    <p><strong>From:</strong> {p.from}</p>
                    <p><strong>Subject:</strong> {p.subject}</p>
                    <p><strong>Interval:</strong> {p.billing_interval || "N/A"}</p>
                    <p><strong>Recurring:</strong> {p.is_subscription ? "Yes" : "No"}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="w-full">
      <Button
        variant="outline"
        onClick={async () => {
            setPurchases(null) // 🧼 Clear session state
            setExpanded(new Set())
            setNoRecords(false)
            setFeedback("")
            await signOut()
        }}
        className="w-full"
        >
        Sign out
        </Button>
      </div>
    </div>
  )
}