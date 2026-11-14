"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DigitalPassCard, getPassDisplayStatus } from "../components/DigitalPassCard";
import { PassHistory } from "../components/PassHistory";
import { PassengerNavigation } from "../components/PassengerNavigation";
import { PassRequestSection } from "../components/PassRequestSection";
import type { DigitalPass, PassRequest } from "../../../../member4/types";

interface DigitalPassClientProps {
  passes: DigitalPass[];
  passError?: string;
  requests: PassRequest[];
  requestHistoryError?: string;
}

export function DigitalPassClient({ passes, passError, requests, requestHistoryError }: DigitalPassClientProps) {
  const router = useRouter();

  const currentPass = passes.find((pass) => getPassDisplayStatus(pass) === "active");
  const history = currentPass
    ? passes.filter((pass) => pass.id !== currentPass.id)
    : passes;

  return (
    <main className="memberPage">
      <PassengerNavigation activePage="digital-pass" />

      <div className="memberMain">
        <div className="pageIntro">
          <div>
            <p className="eyebrow">TRAVEL ACCESS</p>
            <h1>Digital pass</h1>
            <p>One place for your current and previous commuter passes.</p>
          </div>
          <Link className="secondaryButton" href="/member4/profile">
            Back to profile
          </Link>
        </div>

        {passError && (
          <section className="surface" aria-live="polite">
            <p className="formError" role="alert">{passError}</p>
            <button className="secondaryButton" type="button" onClick={() => router.refresh()}>
              Try again
            </button>
          </section>
        )}

        {!passError && (
          <>
            <section aria-labelledby="active-pass">
              <div className="sectionHeading">
                <h2 id="active-pass">Current pass</h2>
              </div>
              {currentPass ? (
                <DigitalPassCard pass={currentPass} />
              ) : (
                <div className="emptyState">
                  <h3>No current active pass</h3>
                  <p>An active pass will appear here when one has been issued and is within its validity dates.</p>
                </div>
              )}
            </section>

            <section aria-labelledby="pass-history">
              <div className="sectionHeading">
                <h2 id="pass-history">Pass history</h2>
              </div>
              <PassHistory passes={history} />
            </section>
          </>
        )}

        <PassRequestSection requests={requests} historyError={requestHistoryError} />
      </div>
    </main>
  );
}
