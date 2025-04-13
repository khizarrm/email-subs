import { google } from "googleapis"
import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function GET(req: NextRequest) {
  const token = await getToken({ req })

  if (!token?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Initialize Google OAuth2 client
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({
    access_token: token.accessToken,
  })

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client, // ✅ This is what Google expects
  })

  const res = await gmail.users.messages.list({
    userId: "me",
    q: 'newer_than:60d subject:(receipt OR subscription OR payment)',
    maxResults: 10,
  })

  const messages = res.data.messages || []
  const subscriptions = []
  
  function detectVendor(subject: string, from: string) {
    const patterns = [
      { name: "Apple", test: from.includes("apple.com") || subject.toLowerCase().includes("apple") },
      { name: "LinkedIn", test: from.includes("linkedin.com") },
      { name: "WSJ", test: from.includes("dowjones.com") || subject.includes("WSJ+") },
      { name: "Rogers", test: from.includes("rogers.com") },
      { name: "Affirm", test: from.includes("affirm.ca") },
      { name: "Eventbrite", test: from.includes("eventbrite.com") },
      { name: "H&R Block", test: from.includes("bambora.com") },
    ]
  
    const matched = patterns.find(p => p.test)
    return matched?.name ?? null
  }
  
  for (const msg of messages) {
    const msgData = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    })
  
    const headers = msgData.data.payload?.headers || []
    const subject = headers.find(h => h.name === "Subject")?.value || ""
    const from = headers.find(h => h.name === "From")?.value || ""
    const date = headers.find(h => h.name === "Date")?.value || ""
  
    const service = detectVendor(subject, from)
  
    if (service) {
      subscriptions.push({ service, subject, from, date })
    }

  return NextResponse.json({ subscriptions })

}
}
