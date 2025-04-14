import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: NextRequest) {
  const token = await getToken({ req })

  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { error } = await supabase
    .from("users")
    .update({ subscriptions_enabled: true })
    .eq("auth_provider_id", token.sub)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
