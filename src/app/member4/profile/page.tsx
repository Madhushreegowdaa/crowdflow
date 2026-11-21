import type { UserProfile } from "../../../../member4/types";
import { connection } from "next/server";
import { requireAuthenticatedUser } from "../../../lib/supabase/require-authenticated-user";
import { ProfileClient } from "./ProfileClient";
import "../Member4.css";

export const instant = false;

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  joined_at: string;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    joinedAt: row.joined_at,
  };
}

export default async function ProfilePage() {
  await connection();
  const { supabase, user } = await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, joined_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <ProfileClient
        profile={null}
        initialStatus="error"
        initialError="We could not load your profile. Please try again."
      />
    );
  }

  if (!data) {
    return <ProfileClient profile={null} initialStatus="missing" />;
  }

  return (
    <ProfileClient
      profile={mapProfile(data as ProfileRow)}
      initialStatus="ready"
    />
  );
}
