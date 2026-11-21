import type { DigitalPass, PassRequest, PassRequestStatus, PassStatus } from "../../../../member4/types";
import { connection } from "next/server";
import { requireAuthenticatedUser } from "../../../lib/supabase/require-authenticated-user";
import { DigitalPassClient } from "./DigitalPassClient";
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

interface PassRequestRow {
  id: string;
  pass_type: string;
  route_category: string;
  status: string;
  created_at: string;
}

function isPassStatus(value: string): value is PassStatus {
  return value === "active" || value === "expired" || value === "pending";
}

function isPassRequestStatus(value: string): value is PassRequestStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

export default async function DigitalPassPage() {
  await connection();
  const { supabase, user } = await requireAuthenticatedUser();
  const [passResult, requestResult] = await Promise.all([
    supabase
      .from("digital_passes")
      .select("id, pass_type, valid_from, valid_until, status, issued_at, route_category")
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
    supabase
      .from("pass_requests")
      .select("id, pass_type, route_category, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const metadataName = user.user_metadata?.full_name;
  const passengerName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : user.email || "Passenger";

  let passes: DigitalPass[] = [];
  let passError: string | undefined;
  if (passResult.error) {
    passError = "We could not load your digital passes. Please try again.";
  } else {
    try {
      passes = ((passResult.data ?? []) as DigitalPassRow[]).map((row): DigitalPass => {
        if (!isPassStatus(row.status)) {
          throw new Error("A pass record contains an unsupported status.");
        }

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
      passError = "A pass record contains an unsupported status. Please contact support.";
    }
  }

  let requests: PassRequest[] = [];
  let requestHistoryError: string | undefined;
  if (requestResult.error) {
    requestHistoryError = "We could not load your pass requests. Please try again.";
  } else {
    try {
      requests = ((requestResult.data ?? []) as PassRequestRow[]).map((row): PassRequest => {
        if (!isPassRequestStatus(row.status)) {
          throw new Error("A pass request contains an unsupported status.");
        }

        return {
          id: row.id,
          passType: row.pass_type,
          routeCategory: row.route_category,
          status: row.status,
          createdAt: row.created_at,
        };
      });
    } catch {
      requestHistoryError = "A pass request has an unsupported status. Please contact support.";
    }
  }

  return (
    <DigitalPassClient
      passes={passes}
      passError={passError}
      requests={requests}
      requestHistoryError={requestHistoryError}
    />
  );
}
