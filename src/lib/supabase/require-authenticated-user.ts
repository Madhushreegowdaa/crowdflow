import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/member4/login");
  }

  return { supabase, user: data.user };
}
