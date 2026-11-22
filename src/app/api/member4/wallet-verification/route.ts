import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to view your wallet." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("wallet_verifications")
    .select("id, verification_status, masked_reference, verified_at, created_at")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load verification status." }, { status: 500 });
  }

  return NextResponse.json({ verification: data ?? null });
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const maskedRef = typeof values.maskedReference === "string" ? values.maskedReference.trim() : "";

  // Only last 4 digits accepted — format: XXXX-XXXX-1234
  if (!/^[Xx*]{4}-[Xx*]{4}-\d{4}$/.test(maskedRef)) {
    return NextResponse.json(
      { error: "Enter the last 4 digits of your Aadhaar in the format XXXX-XXXX-1234." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Sign in to verify your identity." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("wallet_verifications")
    .upsert(
      {
        user_id: authData.user.id,
        verification_status: "pending",
        masked_reference: maskedRef,
        verified_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id, verification_status, masked_reference, verified_at, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not submit verification request." }, { status: 500 });
  }

  return NextResponse.json({ verification: data }, { status: 201 });
}
