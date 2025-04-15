// @deno-types="npm:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import OpenAI from "https://esm.sh/openai"

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
})

console.log("🚀 Gmail Parse Function Started")

serve(async (req) => {
  try {
    const body = await req.json()

    if (!Array.isArray(body.messages) || !body.messages.length) {
      return new Response(JSON.stringify({ error: "No messages provided" }), { status: 400 })
    }

    const results = []
    const skipped = []
    const failed = []

    for (const msg of body.messages) {
      const { subject, from, bodyText, date, messageId, userId, userEmail } = msg

      if (!subject || !bodyText || !from || !userId || !messageId) {
        skipped.push({ messageId, reason: "Missing fields" })
        continue
      }

      if (from.includes(userEmail)) {
        skipped.push({ messageId, reason: "Sent from self" })
        continue
      }

      const lowerSubject = subject.toLowerCase()
      const lowerBody = bodyText.toLowerCase()

      const hasRelevantSubject = /(receipt|payment|invoice|charge|billed)/i.test(lowerSubject)
      const currencyMatch = lowerBody.match(/(?:\$|usd|cad|dollars?)\s*\d+/i)
      const isSuspicious = /(check|deposit|refunded|cancelled|confirmation|failed|pending)/i.test(lowerBody)

      if ((!hasRelevantSubject && !currencyMatch) || isSuspicious) {
        skipped.push({ messageId, reason: "Filtered out" })
        continue
      }

      const prompt = `
You are a billing email parser. Your job is to extract billing details **only if the user is being charged**.

Only extract if:
- The user paid a specific amount ($X.XX, USD 5.00, etc)
- There is evidence of a charge (not just a notice or reminder)

Return a strict JSON like:
{
  "vendor_name": string | null,
  "amount": number | null,
  "currency": string | null,
  "billing_interval": "monthly" | "yearly" | "weekly" | "one-time" | null,
  "is_subscription": boolean
}

Subject: "${subject}"
From: "${from}"
Body:
"""
${bodyText.slice(0, 1500)}
"""`.trim()

      let parsed = {}
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a billing email parser." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        })

        const raw = completion.choices[0]?.message.content || "{}"
        const clean = raw.replace(/```json|```/g, "").trim()
        parsed = JSON.parse(clean)
      } catch (err) {
        console.error("❌ OpenAI Error:", err)
        failed.push({ messageId, error: "OpenAI failed" })
        continue
      }

      const { vendor_name, amount, currency, billing_interval, is_subscription } = parsed as any

      let fallbackAmount = amount
      let fallbackCurrency = currency

      if (!fallbackAmount || !fallbackCurrency) {
        const match = bodyText.match(/(?:\$|USD|CAD|dollars?)\s*([0-9]+(?:\.[0-9]{2})?)/i)
        if (match) {
          fallbackAmount = parseFloat(match[1])
          fallbackCurrency = match[0].includes("USD") ? "USD" : match[0].includes("CAD") ? "CAD" : "$"
        }
      }

      if (!fallbackAmount || !fallbackCurrency) {
        skipped.push({ messageId, reason: "No amount/currency" })
        continue
      }

      // ✅ SKIP DB INSERT — just push result for now
      results.push({
        messageId,
        vendor_name,
        amount: fallbackAmount,
        currency: fallbackCurrency,
        billing_interval: billing_interval || "one-time",
        is_subscription,
        date,
        subject,
        from
      })
    }

    return new Response(JSON.stringify({
      success: true,
      parsedCount: results.length,
      skippedCount: skipped.length,
      failedCount: failed.length,
      parsed: results,
      skipped,
      failed,
    }), { status: 200 })
  } catch (err) {
    console.error("💥 Fatal error:", err)
    return new Response(JSON.stringify({ error: "Unexpected failure" }), { status: 500 })
  }
})
