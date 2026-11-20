import { createClient } from "../../../../lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ message: "Sign in to update your admin profile." }, { status: 401 });
  if (user.app_metadata?.role !== "admin") return Response.json({ message: "Administrator access is required." }, { status: 403 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ message: "Enter valid profile details." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ message: "Enter valid profile details." }, { status: 400 });
  }

  const values = payload as Record<string, unknown>;
  if (Object.keys(values).some((key) => key !== "fullName" && key !== "phone")) {
    return Response.json({ message: "Only your full name and phone number can be updated." }, { status: 400 });
  }
  const fullName = values.fullName;
  const phone = values.phone;
  if (typeof fullName !== "string" || fullName.trim().length < 3 || typeof phone !== "string" || !/^\+?[0-9\s()-]{8,20}$/.test(phone.trim())) {
    return Response.json({ message: "Enter a full name with at least 3 characters and a valid phone number." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName.trim(), phone: phone.trim() })
    .eq("id", user.id)
    .select("id, full_name, email, phone, joined_at")
    .single();

  if (error) {
    console.error("[admin-profile] Profile update failed", { code: error.code });
    return Response.json(
      { message: "We could not save your profile changes. Please try again." },
      { status: error.code === "42501" ? 403 : 500 },
    );
  }

  return Response.json({
    profile: {
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      joinedAt: data.joined_at,
    },
  });
}
