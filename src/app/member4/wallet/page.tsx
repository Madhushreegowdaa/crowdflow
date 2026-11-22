import { connection } from "next/server";
import { requireAuthenticatedUser } from "../../../lib/supabase/require-authenticated-user";
import { WalletClient } from "./WalletClient";
import type { DigitalPass } from "../../../../member4/types";
import type { PassStatus } from "../../../../member4/types";
import "../Member4.css";

export const instant = false;

interface DigitalPassRow {
  id: string;
  pass_type: string;
  valid_from: string;
  valid_until: string;
  status: string;
  issued_at: string;
  route_category: string | null;
}

function isPassStatus(v: string): v is PassStatus {
  return v === "active" || v === "expired" || v === "pending";
}

export default async function WalletPage() {
  await connection();
  const { supabase, user } = await requireAuthenticatedUser();

  const metadataName = user.user_metadata?.full_name;
  const passengerName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : user.email || "Passenger";

  const { data, error } = await supabase
    .from("digital_passes")
    .select("id, pass_type, valid_from, valid_until, status, issued_at, route_category")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  let passes: DigitalPass[] = [];
  let passError: string | undefined;

  if (error) {
    passError = "Could not load your digital passes.";
  } else {
    try {
      passes = ((data ?? []) as DigitalPassRow[]).map((row): DigitalPass => {
        if (!isPassStatus(row.status)) throw new Error("Unsupported pass status.");
        return {
          id: row.id,
          passengerName,
          type: row.pass_type,
          validFrom: row.valid_from,
          validUntil: row.valid_until,
          status: row.status,
          issuedAt: row.issued_at,
          routeCategory: row.route_category ?? undefined,
        };
      });
    } catch {
      passError = "A pass record has an unsupported status.";
    }
  }

  return <WalletClient passes={passes} passError={passError} />;
}
