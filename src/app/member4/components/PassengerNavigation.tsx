"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type PassengerPage = "profile" | "digital-pass";

export function PassengerNavigation({ activePage }: { activePage: PassengerPage }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const { error: signOutError } = await createClient().auth.signOut();
      if (signOutError) throw signOutError;

      router.replace("/member4/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      setError("We could not sign you out. Please try again.");
    }
  }

  return (
    <>
      <header className="memberHeader">
        <Link href="/member4/profile" className="brand">
          <span className="brandMark">C</span>
          <span>CrowdFlow</span>
        </Link>

        <nav aria-label="Passenger navigation">
          <Link
            href="/member4/profile"
            aria-current={activePage === "profile" && pathname === "/member4/profile" ? "page" : undefined}
          >
            Passenger profile
          </Link>
          <Link
            href="/member4/digital-pass"
            aria-current={activePage === "digital-pass" && pathname === "/member4/digital-pass" ? "page" : undefined}
          >
            Digital bus pass
          </Link>
          <button type="button" onClick={() => void signOut()} disabled={loggingOut}>
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </nav>
      </header>
      {error && <p className="formError memberNavError" role="alert">{error}</p>}
    </>
  );
}
