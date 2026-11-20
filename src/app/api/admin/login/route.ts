import { createClient } from "../../../../lib/supabase/server";

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ message: "Enter a valid email address and password." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return Response.json({ message: "Enter a valid email address and password." }, { status: 400 });
  const { email, password } = payload as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) return Response.json({ message: "Enter a valid email address and password." }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error || !data.user) return Response.json({ message: "Email or password is incorrect. Check your details and try again." }, { status: 401 });
    if (data.user.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      return Response.json({ message: "This account does not have administrator access." }, { status: 403 });
    }
    return Response.json({ message: "Signed in." });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Admin sign in is unavailable. Check the Supabase configuration." }, { status: 503 });
  }
}
