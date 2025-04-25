// @deno-types="npm:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import OpenAI from "https://esm.sh/openai"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! })
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
)

console.log("🚀 Gmail Parse Function Started")

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function send(text: string) {
        controller.enqueue(encoder.encode(`data: ${text}\n\n`))
      }

      try {
        const body = await req.json()
        const messages = body.messages || []

        if (!Array.isArray(messages) || messages.length === 0) {
          send("No messages provided.")
          controller.close()
          return
        }

        send(`📥 Scanning ${messages.length} messages...`)

        for (const msg of messages) {
          const { subject, from, bodyText, date, messageId, userId } = msg

          if (!subject || !bodyText || !from || !userId || !messageId) {
            send(`⚠️ Skipped: Missing required fields for messageId ${messageId}`)
            continue
          }

          const lowerBody = bodyText.toLowerCase()
          const suspicious = /(?:refund|declined|failed|cancelled|unsuccessful|not completed)/i
          const confirmation = /(?:receipt|charged|payment (processed|successful)|transaction id|order number)/i
          if (suspicious.test(lowerBody) && !confirmation.test(lowerBody)) {
            send(`🚫 Skipped: ${subject}`)
            continue
          }

          let parsed = {}
          try {
            const prompt = `
            You are a specialized financial email analyzer. Your task is to extract ONLY confirmed and successful purchase information from emails. Follow these strict guidelines:

            1. FIRST: Determine if this email represents a COMPLETED and SUCCESSFUL financial transaction. Look for:
              - Explicit confirmation language ("payment successful", "purchase confirmed", "receipt", "charged", "payment processed")
              - Absence of failure indicators ("declined", "unsuccessful", "failed", "not completed", "rejected", "issue processing")
              - Transaction IDs or order numbers that indicate completion

            2. If this is NOT a successful transaction (payment failure, reminder, marketing), respond with ONLY:
              {
                "is_valid_transaction": false
              }

            3. For CONFIRMED successful transactions ONLY, extract and return the following JSON structure:
              {
                "is_valid_transaction": true,
                "user_id": null,
                "service_name": "MERCHANT OR VENDOR NAME",
                "amount": "NUMERIC AMOUNT (WITHOUT CURRENCY SYMBOL)",
                "currency": "CURRENCY CODE (DEFAULT TO USD IF UNCERTAIN)",
                "billing_interval": "monthly" | "yearly" | "quarterly" | "weekly" | "one-time",
                "detected_on": null,
                "last_seen_email_id": null,
                "is_active": true
              }

            Subject: "${subject}"
            From: "${from}"
            Body:
            """
            ${bodyText.slice(0, 1500)}
            """
            `.trim()

            const completion = await openai.chat.completions.create({
              model: "gpt-4-turbo",
              messages: [
                {
                  role: "system",
                  content: `You extract billing data only if a successful financial transaction occurred.\n\nRules:\n- Only return is_valid_transaction: true if there's confirmation of payment.\n- Ignore failed payments, reminders, or marketing emails.\n- Be precise. Respond with structured values only.`
                },
                {
                  role: "user",
                  content: prompt
                }
              ],
              temperature: 0,
              function_call: { name: "extract_transaction" },
              functions: [
                {
                  name: "extract_transaction",
                  description: "Extracts confirmed and successful billing info",
                  parameters: {
                    type: "object",
                    properties: {
                      is_valid_transaction: { type: "boolean" },
                      user_id: { type: "string", nullable: true },
                      service_name: { type: "string", nullable: true },
                      amount: { type: "string", nullable: true },
                      currency: { type: "string", nullable: true },
                      billing_interval: {
                        type: "string",
                        enum: ["monthly", "yearly", "quarterly", "weekly", "one-time"],
                        nullable: true
                      },
                      detected_on: { type: "string", nullable: true },
                      last_seen_email_id: { type: "string", nullable: true },
                      is_active: { type: "boolean", nullable: true }
                    },
                    required: ["is_valid_transaction"]
                  }
                }
              ]
            })

            parsed = JSON.parse(
              completion.choices[0].message.function_call?.arguments || "{}"
            )
          } catch (err) {
            send(`❌ OpenAI failed to parse ${subject}`)
            continue
          }

          if (!parsed.is_valid_transaction) {
            send(`⚠️ Not a valid transaction: ${subject}`)
            continue
          }

        // Parse result
        let { service_name, amount, currency, billing_interval } = parsed as any
        const is_subscription = billing_interval !== "one-time"

        // Fallback extraction if OpenAI failed to extract amount/currency
        if (!amount || !currency) {
          const match = bodyText.match(/(?:\$|USD|CAD|dollars?)\s*([0-9]+(?:\.[0-9]{2})?)/i)
          if (match) {
            amount = match[1]
            currency = match[0].includes("CAD") ? "CAD" : "USD"
          } else {
            send(`⚠️ No amount/currency found in ${subject}`)
            continue
          }
        }

        // 🟢 Step 1: Always insert into `purchases`
        const { error: purchaseErr } = await supabase.from("purchases").insert({
          user_id: userId,
          message_id: messageId,
          vendor: service_name || "Unknown",
          amount,
          currency,
          billing_interval: billing_interval || "one-time",
          is_subscription,
          detected_on: date || new Date().toISOString(),
        })

        if (purchaseErr) {
          send(`❌ Failed to insert purchase: ${subject}`)
          continue
        }

        // 🔁 Step 2: If it's a subscription, update `subscriptions` table
        if (is_subscription) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("last_seen_email_id", messageId)
            .maybeSingle()

          if (existing) {
            send(`🔁 Subscription already exists: ${service_name}`)
            continue
          }

          const { error: subErr } = await supabase.from("subscriptions").insert({
            user_id: userId,
            service_name: service_name || "Unknown",
            amount,
            currency,
            billing_interval: billing_interval,
            detected_on: new Date().toISOString(),
            last_seen_email_id: messageId,
            is_active: true,
          })

          if (subErr) {
            send(`❌ Failed to insert subscription: ${subject}`)
            continue
          }

          send(`✅ Subscribed to: ${service_name}`)
        } else {
          send(`🛒 One-time purchase saved: ${service_name}`)
        }
      }
      } catch (err) {
        send("💥 Fatal error occurred.")
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  })
})
