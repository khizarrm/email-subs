import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { JSDOM } from "jsdom"
import { openai } from "@/lib/openaiClient"
import { supabase } from "@/lib/supabaseClient"

export async function GET(req: NextRequest) {
  console.time("/api/gmail/scan duration")
  console.log("🍪 Cookies:", req.headers.get("cookie"))
  
  console.log("Getting token...")
  const token = await getToken({ req })

  if (!token?.accessToken || !token.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (!token?.refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 })
  }

  console.log("🧠 Authenticated token.sub (user id):", token.sub)
  console.log("📧 Authenticated token.email:", token.email)

  console.log("Getting user token...")
  const { data: userRecord, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("auth_provider_id", token.sub)
    .maybeSingle()

  if (userErr) {
    console.error("❌ Supabase user query error:", userErr)
    return NextResponse.json({ error: "User fetch failed" }, { status: 500 })
  }

  if (!userRecord) {
    console.error("❌ Could not find user with auth_provider_id", token.sub)
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const userId = userRecord.id

  console.log("Calling oauth2 client...")
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
  })

  console.log("Refresh token exists:", !!token.refreshToken)
  console.log("📧 Fetching Gmail messages...")
  console.time("⏱️ Gmail fetch duration")
  let messages = []
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client })
    const res = await gmail.users.messages.list({
      userId: "me",
      q: 'newer_than:60d (subject:receipt OR subject:invoice OR subject:"charged" OR subject:"billed") -from:me',
      maxResults: 100,
    })
    messages = res.data.messages || []
  } catch (err) {
    console.error("📨 Gmail list error:", err)
    return NextResponse.json({ error: "Failed to fetch Gmail messages" }, { status: 500 })
  }
  console.timeEnd("⏱️ Gmail fetch duration")

  console.log("📧 Found messages:", messages.length)
  const results : any[] = []

  const debugInfo = {
    totalFetched: messages.length,
    processed: results.length,
    user: {
      id: userId,
      email: token.email,
      authProviderId: token.sub,
    },
    execution: {
      startedAt: new Date().toISOString(),
    },
    errors: [],
  }
  

  console.log("Extracting body text...")
  function extractBodyText(payload: any): string {
    function findPart(part: any): string | null {
      if (part.mimeType === "text/html") {
        const data = part.body?.data
        if (data) {
          const decoded = Buffer.from(data, "base64").toString("utf8")
          const dom = new JSDOM(decoded)
          const textContent = dom.window.document.body.textContent || ""
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

  async function processOneMessage(msg: any, oauth2Client: any, userId: string, results: any[], userEmail: string) {
    try {
      const gmail = google.gmail({ version: "v1", auth: oauth2Client })
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      })
  
      const headers = msgData.data.payload?.headers || []
      const subject = headers.find(h => h.name === "Subject")?.value || ""
      const from = headers.find(h => h.name === "From")?.value || ""
      const date = headers.find(h => h.name === "Date")?.value || ""


      if (from.includes(userEmail)) {
        console.log("📤 Skipping sent email from self:", subject)
        return
      } //Skip it if its a user email 
    
    
      const bodyText = extractBodyText(msgData.data.payload)
  
      const lowerSubject = subject.toLowerCase()
      const lowerBody = bodyText.toLowerCase()

      const currencyMatch = bodyText.match(/(?:\$|USD|CAD|dollars?)\s*([0-9]+(?:\.[0-9]{2})?)/i)
      const hasRelevantSubject = /(receipt|payment|invoice|charge|billed)/i.test(lowerSubject)
      const isSuspicious = /(check|deposit|refunded|cancelled|confirmation|failed|pending)/i.test(lowerBody)

      if ((!hasRelevantSubject && !currencyMatch) || isSuspicious) {
        console.log("🛑 Skipping email:", subject)
        return
      }

      console.log("📧 Parsing email with OpenAI...")
      const prompt = `
        You are a billing email parser. Your job is to extract billing details **only if the user is being charged for a purchase or subscription**.
        
        You MUST NOT extract data in the following cases:
        - It’s a **marketing email**, a **reminder**, or a **generic receipt** with no amount charged.
        
        Only extract the data if:
        - The user **paid a specific amount** (like $4.99, USD 6.99, or 8.99 CAD)
        - There is **evidence the user was charged**, not just notified.
        
        Your response must be a strict JSON object:
        {
          "vendor_name": string | null,
          "amount": number | null,
          "currency": string | null,
          "billing_interval": "monthly" | "yearly" | "weekly" | "one-time" | null,
          "is_subscription": boolean
        }
        
        Given the following email metadata and body, extract structured data ONLY IF the user has been clearly charged:
        
        Subject: "${subject}"
        From: "${from}"
        Body:
        """
        ${bodyText.slice(0, 1500)}
        """
        ` 
  
      let parsed: any = {}
      try {
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
        parsed = JSON.parse(clean)
      } catch (err) {
        console.error("❌ OpenAI parsing failed:", err)
        return
      }
  
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
  
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const result: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size))
    }
    return result
  }
  
  async function processInChunks(
    messages: any[],
    chunkSize: number,
    oauth2Client: any,
    userId: string,
    results: any[],
    userEmail: string
  ) {
    const chunks = chunkArray(messages, chunkSize)
  
    for (const [i, chunk] of chunks.entries()) {
      console.log(`⚙️ Processing chunk ${i + 1}/${chunks.length} with ${chunk.length} messages...`)
      
      const promises = chunk.map((msg) =>
        processOneMessage(msg, oauth2Client, userId, results, userEmail)
      )
  
      await Promise.allSettled(promises) // Runs this chunk in parallel
    }
  }
  
  
  const resultsArray: any[] = []

  console.log("📧 Parsing messages in chunks...")
  console.time("⏱️ Parsing message duration")
  await processInChunks(messages, 5, oauth2Client, userId, results, token.email!) //chunk size of 6 is ideal(max) for openai 

  console.log("After time end")
  console.timeEnd("⏱️ Parsing message duration")

  console.timeEnd("/api/gmail/scan duration")
  

  console.log("Before time end")
  if (results.length === 0) {
    return NextResponse.json({ message: "No records found", messages: [] }, { status: 200 })
  }

  console.log("Returning stuff now")

  return NextResponse.json({ messages: results, summary: debugInfo}, { status: 200 })
}