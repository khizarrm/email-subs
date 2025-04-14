"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"


export function Dashboard() {
  const { data: session } = useSession()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [purchases, setPurchases] = useState<any[] | null>(null)
  const [feedback, setFeedback] = useState("")

  const handleScan = async () => {
    setLoading(true)
    setFeedback("")
    const res = await fetch("/api/gmail/scan")
    const data = await res.json()
    setPurchases(data.messages)
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

      {purchases && (
        <>
          <h2 className="text-2xl font-semibold mt-8">Summary of Purchases</h2>
          <ul className="space-y-4 text-left">
            {purchases.map((p, i) => (
              <li key={i} className="border rounded-lg p-4 shadow-sm">
                <p><strong>Vendor:</strong> {p.vendor_name || "Unknown"}</p>
                <p><strong>Amount:</strong> {p.amount} {p.currency}</p>
                <p><strong>Date:</strong> {new Date(p.date).toLocaleDateString()}</p>
                <p><strong>From:</strong> {p.from}</p>
                <p><strong>Subject:</strong> {p.subject}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="w-full">
    <Button variant="outline" onClick={() => signOut()} className="w-full">
      Sign out
    </Button>
  </div>

    </div>
  )
}
