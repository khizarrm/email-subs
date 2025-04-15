import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { JSDOM } from "jsdom"
import { supabase } from "@/lib/supabaseClient"

export async function GET(req: NextRequest) {
  console.time("/api/gmail/scan duration")
  const token = await getToken({ req })

  if (!token?.accessToken || !token.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (!token.refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 401 })
  }

  const { data: userRecord, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("auth_provider_id", token.sub)
    .maybeSingle()

  if (userErr || !userRecord) {
    return NextResponse.json({ error: "User lookup failed" }, { status: 404 })
  }

  const userId = userRecord.id
  const userEmail = token.email!
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
  })

  const gmail = google.gmail({ version: "v1", auth: oauth2Client })
  let messages = []

  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: 'newer_than:60d (subject:receipt OR subject:invoice OR subject:payment OR subject:"charged" OR subject:"billed") -from:me',
      maxResults: 100,
    })
    messages = res.data.messages || []
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch Gmail messages" }, { status: 500 })
  }

  console.log("RES MESSAGES", messages)

  function extractBodyText(payload: any): string {
    function findPart(part: any): string | null {
      if (part.mimeType === "text/html") {
        const data = part.body?.data
        if (data) {
          const decoded = Buffer.from(data, "base64").toString("utf8")
          const dom = new JSDOM(decoded)
          return dom.window.document.body.textContent || ""
        }
      }
      if (part.mimeType === "text/plain") {
        return part.body?.data ? Buffer.from(part.body.data, "base64").toString("utf8") : ""
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

  const formattedMessages = []

  for (const msg of messages) {
    try {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      })

      const payload = msgData.data.payload
      const headers = payload?.headers || []
      const subject = headers.find((h) => h.name === "Subject")?.value || ""
      const from = headers.find((h) => h.name === "From")?.value || ""
      const date = headers.find((h) => h.name === "Date")?.value || ""
      const bodyText = extractBodyText(payload)

      // 🧠 DEEP FILTERING
      const lowerSubject = subject.toLowerCase()
      const lowerBody = bodyText.toLowerCase()
      const isSuspicious = /(check|deposit|refunded|cancelled|confirmation|failed|pending)/i.test(lowerBody)

      const isFromUser = from.includes(userEmail)
      if (isSuspicious) {
        console.log("🛑 Skipping message:", subject)
        continue
      }

      formattedMessages.push({
        subject,
        from,
        bodyText,
        date,
        messageId: msg.id!,
        userId,
        userEmail,
      })
    } catch (err) {
      console.error("❌ Failed to process message:", err)
    }
  }

  console.timeEnd("/api/gmail/scan duration")
  console.log("📧 Filtered messages:", formattedMessages.length)

  return NextResponse.json({ messages: formattedMessages }, { status: 200 })
}
