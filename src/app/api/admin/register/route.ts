import { createClient as createSupabaseClient } from "@supabase/supabase-js";

type SupabaseFailure = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
};

function safeMessage(message: string, secrets: Array<string | undefined>) {
  let result = message;
  for (const secret of secrets) {
    if (secret) result = result.split(secret).join("[redacted]");
  }
  return result
    .replace(/\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/gi, "[redacted key]")
    .replace(/\beyJ[A-Za-z0-9._-]{20,}/g, "[redacted token]")
    .slice(0, 1000);
}

function describeFailure(error: unknown, secrets: Array<string | undefined>) {
  const failure = (error && typeof error === "object" ? error : {}) as SupabaseFailure;
  const message = typeof failure.message === "string" ? failure.message : "Unknown Supabase error.";
  const code = typeof failure.code === "string" ? failure.code : undefined;
  const status = typeof failure.status === "number" ? failure.status : undefined;
  return { message: safeMessage(message, secrets), code, status };
}

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ message: "Enter valid registration details." }, { status: 400 }); }
  if (!payload || typeof payload !== "object") return Response.json({ message: "Enter valid registration details." }, { status: 400 });
  const { fullName, email, phone, password, invitationCode } = payload as Record<string, unknown>;
  if (typeof fullName !== "string" || fullName.trim().length < 3 || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof phone !== "string" || !phone.trim() || typeof password !== "string" || password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || typeof invitationCode !== "string" || !invitationCode.trim()) {
    return Response.json({ message: "Check that your full name has at least 3 characters, and provide an email, phone number, password, and invitation code." }, { status: 400 });
  }
  const expectedCode = process.env.CROWDFLOW_ADMIN_INVITATION_CODE;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const urlIsValid = (() => {
    if (!supabaseUrl) return false;
    try {
      const parsed = new URL(supabaseUrl);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  })();
  const configState = {
    supabaseUrlConfigured: Boolean(supabaseUrl),
    supabaseUrlValid: urlIsValid,
    serviceRoleKeyConfigured: Boolean(serviceRoleKey),
    invitationCodeConfigured: Boolean(expectedCode),
  };
  console.info("[admin-register] Server configuration check", configState);

  if (!expectedCode || !supabaseUrl || !urlIsValid || !serviceRoleKey) {
    const missing: string[] = [];
    if (!expectedCode) missing.push("CROWDFLOW_ADMIN_INVITATION_CODE");
    if (!urlIsValid) missing.push("NEXT_PUBLIC_SUPABASE_URL (valid URL)");
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    console.error("[admin-register] Required configuration is missing or invalid", { ...configState, missing });
    return Response.json({ message: `Admin registration is not configured correctly. Check: ${missing.join(", ")}.` }, { status: 503 });
  }
  if (invitationCode !== expectedCode) return Response.json({ message: "That invitation code is not valid." }, { status: 403 });

  const secrets = [serviceRoleKey, expectedCode, password, invitationCode, phone];
  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { error } = await supabase.auth.admin.createUser({
      email: email.trim(), password, email_confirm: true,
      user_metadata: { full_name: fullName.trim(), phone: phone.trim() },
      app_metadata: { role: "admin" },
    });
    if (error) {
      const failure = describeFailure(error, secrets);
      console.error("[admin-register] Supabase admin.createUser failed", {
        message: failure.message,
        code: failure.code,
        httpStatus: failure.status,
      });
      if (failure.code === "email_exists" || /already registered|already been registered/i.test(failure.message)) {
        return Response.json({ message: "An account with this email already exists. Sign in or contact your administrator." }, { status: 409 });
      }
      const detailedMessage = process.env.NODE_ENV === "development"
        ? `Supabase could not create the admin account${failure.code ? ` (${failure.code})` : ""}${failure.status ? ` [HTTP ${failure.status}]` : ""}: ${failure.message}`
        : "Admin account could not be created. Check the server logs for details.";
      return Response.json({ message: detailedMessage }, { status: 502 });
    }
  } catch (error) {
    const failure = describeFailure(error, secrets);
    console.error("[admin-register] Supabase admin.createUser request threw an exception", {
      message: failure.message,
      code: failure.code,
      httpStatus: failure.status,
    });
    const detailedMessage = process.env.NODE_ENV === "development"
      ? `The Supabase admin request failed${failure.code ? ` (${failure.code})` : ""}${failure.status ? ` [HTTP ${failure.status}]` : ""}: ${failure.message}`
      : "Admin account could not be created. Check the server logs for details.";
    return Response.json({ message: detailedMessage }, { status: 502 });
  }
  return Response.json({ message: "Your admin account was created. You can now sign in." }, { status: 201 });
}
