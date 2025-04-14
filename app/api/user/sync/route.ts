import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(req: NextRequest) {
  const token = await getToken({ req })

  if (!token?.sub || !token?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const authProviderId = token.sub
  const email = token.email

  // Check if this auth_provider_id already exists
  const { data: existing, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_id", authProviderId)
    .maybeSingle()

  if (!existing && !error) {
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      email,
      auth_provider_id: authProviderId,
    })

    if (insertError) {
      return NextResponse.json({ error: "Insert failed", details: insertError }, { status: 500 })
    }
  }

  return NextResponse.json({ status: "ok" })
}
