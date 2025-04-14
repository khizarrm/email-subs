import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { JSDOM } from "jsdom"
import { openai } from "@/lib/openaiClient"
import { supabase } from "@/lib/supabaseClient"

export async function GET(req: NextRequest) {
  const token = await getToken({ req })

  if (!token?.accessToken || !token.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: userRecord, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("auth_provider_id", token.sub)
    .maybeSingle()

  if (userErr || !userRecord) {
    console.error("❌ Could not find user with auth_provider_id", token.sub)
    return
  }

  const userId = userRecord.id

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
  })

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  const res = await gmail.users.messages.list({
    userId: "me",
    q: 'newer_than:60d subject:(receipt OR subscription OR payment)',
    maxResults: 50,
  })

  const messages = res.data.messages || []
  const results = []

  function extractBodyText(payload: any): string {
    function findPart(part: any): string | null {
      if (part.mimeType === "text/html") {
        const data = part.body?.data
        if (data) {
          const decoded = Buffer.from(data, "base64").toString("utf8")
          const dom = new JSDOM(decoded)
          const textContent = dom.window.document.body.textContent || ""
  
          // ⬇️ Grab all table content as raw strings to avoid flattening losses
          const tdValues = Array.from(dom.window.document.querySelectorAll("td, th, p"))
            .map(el => el.textContent?.trim())
            .filter(Boolean)
            .join(" | ")
  
          return `${textContent}\n\nExtra: ${tdValues}`
        }
      }
  
      if (part.mimeType === "text/plain") {
        const data = part.body?.data
        return data ? Buffer.from(data, "base64").toString("utf8") : ""
      }
  
      if (Array.isArray(part.parts)) {
        for (const child of part.parts) {
          const found = findPart(child)
          if (found) return found
        }
      }
  
      return null
    }
  
    return findPart(payload) || ""
  }
  

  for (const msg of messages) {
    try {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      })

      const headers = msgData.data.payload?.headers || []
      const subject = headers.find(h => h.name === "Subject")?.value || ""
      const from = headers.find(h => h.name === "From")?.value || ""
      const date = headers.find(h => h.name === "Date")?.value || ""
      const bodyText = extractBodyText(msgData.data.payload)
      const currencyMatch = bodyText.match(/(?:\$|USD|CAD|dollars?)\s*([0-9]+(?:\.[0-9]{2})?)/i)

      const isReceipt = subject.toLowerCase().includes("receipt")
      if (!isReceipt && !currencyMatch) {
        console.log("🛑 Skipping due to no currency match:", subject)
        continue
      }
      

      // 🧠 Basic spam/scam detection: ignore emails with "check" or "deposit" and no vendor domain
      const lowerBody = bodyText.toLowerCase()
      if (lowerBody.includes("check") && lowerBody.includes("deposit")) {
        console.log("⚠️ Skipping email likely about a check, not a charge:", subject)
        continue
      }

      const prompt = `
        You are a billing email parser. Your job is to extract billing details **only if the user is being charged or billed**.

        You MUST NOT extract data if the email is:
        - about a check being sent TO the user
        - a refund or reimbursement
        - just a notification or marketing email
        - a receipt without an amount charged

        Only extract the data if the amount is associated with a currency (like $ or USD or CAD or dollars).

        Your response must be a strict JSON object like this:
        {
        "vendor_name": string | null,
        "amount": number | null,
        "currency": string | null,
        "billing_interval": "monthly" | "yearly" | "weekly" | "one-time" | null,
        "is_subscription": boolean
        }

        Given the following email metadata and body, extract structured data **only if there was a real payment charged to the user**:

        Subject: "${subject}"
        From: "${from}"
        Body:
        """
        ${bodyText.slice(0, 3000)}
        """
      `

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a billing email parser." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      })

      const jsonStr = completion.choices[0].message.content || "{}"
      const clean = jsonStr.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      let fallbackAmount = parsed.amount
      let fallbackCurrency = parsed.currency

      if (fallbackAmount == null || fallbackCurrency == null) {
        const match = bodyText.match(/(?:\$|USD|CAD|dollars?)\s*([0-9]+(?:\.[0-9]{2})?)/i)
        if (match) {
          fallbackAmount = parseFloat(match[1])
          fallbackCurrency = match[0].includes("USD") ? "USD" : match[0].includes("CAD") ? "CAD" : "$"
        }
      }

      const finalAmount = fallbackAmount ?? null
      const finalCurrency = fallbackCurrency ?? null

      // 👀 Only save if both amount and currency are valid
      if (finalAmount !== null && finalCurrency !== null) {
        results.push({
          subject,
          from,
          date,
          vendor_name: parsed.vendor_name,
          amount: finalAmount,
          currency: finalCurrency,
          billing_interval: parsed.billing_interval,
          is_subscription: parsed.is_subscription,
        })

        const { error: insertError } = await supabase.from("subscriptions").insert({
          user_id: userId,
          service_name: parsed.vendor_name || "Unknown",
          amount: finalAmount,
          currency: finalCurrency,
          billing_interval: parsed.billing_interval || "one-time",
          last_seen_email_id: msg.id!,
        })

        if (insertError) {
          console.error("❌ Supabase insert error:", insertError)
        }
      }
    } catch (err) {
      console.error("❌ Error parsing message:", err)
      results.push({ error: "Failed to parse", id: msg.id })
    }
  }

  return NextResponse.json({ messages: results }, { status: 200 })
}
