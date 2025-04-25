"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"
import {ScanProgress} from "./scanprogress"
import { supabase } from "@/lib/supabaseClient"
import { getToken } from "next-auth/jwt"

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
  const [logs, setLogs] = useState<string[]>([])


  const toggleExpand = (index: number) => {
    setExpanded(prev => {
      const newSet = new Set(prev)
      newSet.has(index) ? newSet.delete(index) : newSet.add(index)
      return newSet
    })
  }

  const handleScan = async () => {
    console.log("⚡ Starting scan...")
    setLoading(true)
    setFeedback("Fetching emails...")
  
    try {
      // Step 1: Gmail scan
      const res = await fetch("/api/gmail/scan", {
        method: "GET",
        credentials: "include",
      })
  
      const data = await res.json()
      if (!data.messages || data.messages.length === 0) {
        setFeedback("🚫 No emails found to scan.")
        setLoading(false)
        return
      }
  
      setFeedback(`📤 Sending ${data.messages.length} messages to Supabase...`)
      
      const supabaseRes = await fetch("https://caoivbabwqjvwmwjxprt.supabase.co/functions/v1/gmail-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: data.messages }),
      })
  
      if (!supabaseRes.ok) {
        throw new Error(`Supabase returned ${supabaseRes.status}`)
      }
  
      console.log("🎉 Sent to Supabase successfully")
      setFeedback("✅ Scan sent to Supabase for processing.")
      console.log("SUPABASE ID", session?.user?.supabase_id)
      
      // 🧠 Grab summary directly from subscriptions table
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session?.user?.supabase_id)
        .gte("detected_on", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
  
      if (error || !subs) {
        console.error("❌ Failed to fetch subscriptions:", error)
        return
      }
  
      const recurring = subs.filter((s) => s.billing_interval !== "one-time")
      const oneTime = subs.filter((s) => s.billing_interval === "one-time")
  
      const recurringTotal = recurring.reduce((sum, s) => sum + parseFloat(s.amount), 0)
      const oneTimeTotal = oneTime.reduce((sum, s) => sum + parseFloat(s.amount), 0)
  
      console.log(`
  📬 Your Monthly Spending Summary
  
  🔁 Subscriptions:
  ${recurring.length ? recurring.map((s) => `- ${s.service_name} – $${s.amount} ${s.currency} (${s.billing_interval})`).join("\n") : "None"}
  
  🛍️ One-Time Purchases:
  ${oneTime.length ? oneTime.map((s) => `- ${s.service_name} – $${s.amount} ${s.currency}`).join("\n") : "None"}
  
  📊 Totals:
  - Recurring: $${recurringTotal.toFixed(2)}
  - One-time: $${oneTimeTotal.toFixed(2)}
  - Overall: $${(recurringTotal + oneTimeTotal).toFixed(2)}
      `.trim())
  
    } catch (err: any) {
      console.error("❌ Scan error:", err)
      setFeedback(`❌ Error: ${err.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
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

        {loading && (
          <div className="p-4 bg-zinc-900 text-white rounded-lg mt-4 text-sm font-mono text-left max-h-60 overflow-y-auto">
            <p className="mb-2 font-semibold">🔄 Live Scan Log:</p>
            {logs.map((log, i) => (
              <div key={i}>• {log}</div>
            ))}
          </div>
        )}



      </div>
      {/* <ScanProgress /> */}
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
                <p><strong>Vendor:</strong> {p.service_name || "Unknown"}</p>
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