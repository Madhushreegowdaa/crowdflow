"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import { PASS_TYPE_OPTIONS, type PassRequest, type PassRequestStatus, type PassType } from "../../../../member4/types";

interface PassRequestSectionProps {
  requests: PassRequest[];
  historyError?: string;
}

const requestStatusLabels: Record<PassRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

export function PassRequestSection({ requests: initialRequests, historyError }: PassRequestSectionProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [passType, setPassType] = useState<PassType | "">(PASS_TYPE_OPTIONS[0]);
  const [routeCategory, setRouteCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const submissionInProgress = useRef(false);

  // Realtime: update request status live when admin approves/rejects
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("pass-requests-user")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pass_requests" },
        (payload) => {
          const updated = payload.new as { id: string; status: string; pass_type: string; route_category: string; created_at: string };
          setRequests((prev) =>
            prev.map((r) =>
              r.id === updated.id
                ? { ...r, status: updated.status as PassRequestStatus }
                : r
            )
          );
          if (updated.status === "approved") {
            setMessageType("success");
            setMessage("Your pass request was approved! Your digital pass has been issued.");
          } else if (updated.status === "rejected") {
            setMessageType("error");
            setMessage("Your pass request was not approved. Please contact support.");
          }
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current || !passType || !routeCategory.trim()) return;

    submissionInProgress.current = true;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/member4/pass-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passType, routeCategory: routeCategory.trim() }),
      });
      const result = (await response.json()) as { request?: PassRequest; error?: string };
      if (!response.ok || !result.request) {
        throw new Error(result.error || "We could not submit your pass request. Please try again.");
      }

      setRequests((current) => [result.request!, ...current]);
      setRouteCategory("");
      setMessageType("success");
      setMessage("Your pass request has been submitted.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "We could not submit your pass request. Please try again.");
    } finally {
      submissionInProgress.current = false;
      setSubmitting(false);
    }
  }

  return (
    <section className="surface passRequestSection" aria-labelledby="request-pass-heading">
      <h2 id="request-pass-heading">Request Digital Pass</h2>
      <form className="passRequestForm" onSubmit={submit}>
        <div className="field">
          <label htmlFor="requestedPassType">Pass type</label>
          <select
            id="requestedPassType"
            className="passRequestSelect"
            value={passType}
            onChange={(event) => setPassType(event.target.value as PassType)}
            disabled={submitting}
            required
          >
            {PASS_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="requestedRouteCategory">Route category</label>
          <input
            id="requestedRouteCategory"
            className="passRequestSelect"
            value={routeCategory}
            onChange={(event) => setRouteCategory(event.target.value)}
            placeholder="Enter your route category"
            maxLength={120}
            disabled={submitting}
            required
          />
        </div>

        <button className="primaryButton passRequestSubmit" type="submit" disabled={submitting || !routeCategory.trim()}>
          {submitting ? "Submitting request…" : "Submit request"}
          {!submitting && <span aria-hidden="true">→</span>}
        </button>
      </form>

      {message && (
        <p className={messageType === "error" ? "formError" : "successMessage"} role={messageType === "error" ? "alert" : "status"}>
          {message}
        </p>
      )}

      <div className="passRequestHistory" aria-live="polite">
        <div className="sectionHeading">
          <h3>Your pass requests</h3>
          {!historyError && requests.length > 0 && <span className="hint">{requests.length} {requests.length === 1 ? "request" : "requests"}</span>}
        </div>

        {historyError ? (
          <p className="formError" role="alert">{historyError}</p>
        ) : requests.length === 0 ? (
          <div className="emptyState">
            <h3>No pass requests yet</h3>
            <p>Your submitted requests and their review status will appear here.</p>
          </div>
        ) : (
          <ul className="passRequestList">
            {requests.map((request) => (
              <li className="passRequestItem" key={request.id}>
                <div className="passRequestDetails">
                  <strong>{request.passType}</strong>
                  <span>{request.routeCategory}</span>
                  <span>Submitted {formatDate(request.createdAt)}</span>
                </div>
                <span className={`statusBadge requestStatus${request.status}`}>
                  <span className="statusDot" aria-hidden="true" />
                  {requestStatusLabels[request.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
