"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { AuthInput } from "../components/AuthInput";
import { PassengerNavigation } from "../components/PassengerNavigation";
import type { UserProfile } from "../../../../member4/types";
import { isValidPhone } from "../../../../member4/utils/validation";
import { createClient } from "../../../lib/supabase/client";
import "../Member4.css";

function formatJoinedDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatSearchDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" :
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

interface SearchEntry {
  source: string;
  destination: string;
  crowdFilter: string;
  searchedAt: string;
}

type PageStatus = "ready" | "missing" | "error";

interface ProfileClientProps {
  profile: UserProfile | null;
  initialStatus: PageStatus;
  initialError?: string;
}

export function ProfileClient({ profile: initialProfile, initialStatus, initialError = "" }: ProfileClientProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [status] = useState<PageStatus>(initialStatus);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(initialError);
  const [messageType, setMessageType] = useState<"success" | "error">(initialError ? "error" : "success");
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>([]);
  const submissionInProgress = useRef(false);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  function getSupabase() {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }

  // Load search history from localStorage
  useEffect(() => {
    if (!initialProfile?.id) return;
    try {
      const raw = localStorage.getItem(`crowdflow_search_history_${initialProfile.id}`);
      setSearchHistory(raw ? JSON.parse(raw) : []);
    } catch { setSearchHistory([]); }
  }, [initialProfile?.id]);

  function clearHistory() {
    if (!initialProfile?.id) return;
    localStorage.removeItem(`crowdflow_search_history_${initialProfile.id}`);
    setSearchHistory([]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    if (fullName.trim().length < 3) {
      setMessageType("error");
      setMessage("Please enter a valid full name (at least 3 characters).");
      return;
    }
    if (!isValidPhone(phone)) {
      setMessageType("error");
      setMessage("Please enter a valid phone number.");
      return;
    }

    submissionInProgress.current = true;
    setSaving(true);
    setMessage("");

    try {
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        router.replace("/member4/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() })
        .eq("id", authData.user.id)
        .select("id, full_name, email, phone, joined_at")
        .single();

      if (error) {
        throw error;
      }

      const updatedProfile: UserProfile = {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        joinedAt: data.joined_at,
      };
      setProfile(updatedProfile);
      setFullName(updatedProfile.fullName);
      setPhone(updatedProfile.phone);
      setEditing(false);
      setMessageType("success");
      setMessage("Your profile changes have been saved.");
    } catch {
      setMessageType("error");
      setMessage("We could not save your changes. Please try again.");
    } finally {
      submissionInProgress.current = false;
      setSaving(false);
    }
  }

  function cancelEditing() {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setEditing(false);
    setMessage("");
  }

  return (
    <main className="memberPage">
      <PassengerNavigation activePage="profile" />

      <div className="memberMain">
        <div className="pageIntro">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h1>Profile</h1>
            <p>Keep your passenger details up to date.</p>
          </div>

          <Link className="secondaryButton" href="/member4/digital-pass">
            View digital pass
          </Link>
        </div>

        {status === "error" && (
          <section className="surface" aria-live="polite">
            <p className="formError" role="alert">{message}</p>
            <button className="secondaryButton" type="button" onClick={() => router.refresh()}>
              Try again
            </button>
          </section>
        )}

        {status === "missing" && (
          <section className="surface" aria-live="polite">
            <h2>Profile unavailable</h2>
            <p className="hint">We could not find a passenger profile for your account. Please contact support for help.</p>
          </section>
        )}

        {status === "ready" && profile && (
          <>
          <div className="contentGrid">
            <section className="surface" aria-labelledby="profile-details">
              <h2 id="profile-details">Personal details</h2>

              <div className="profileHero">
                <div className="avatar" aria-hidden="true">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{profile.fullName}</strong>
                  <span>Member since {formatJoinedDate(profile.joinedAt)}</span>
                </div>
              </div>

              {editing ? (
                <form className="editForm" onSubmit={save}>
                  <AuthInput
                    id="profileName"
                    label="Full name"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setMessage("");
                    }}
                    autoComplete="name"
                    required
                    disabled={saving}
                  />
                  <AuthInput
                    id="profilePhone"
                    label="Phone number"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setMessage("");
                    }}
                    autoComplete="tel"
                    required
                    disabled={saving}
                  />
                  <div className="inlineRow">
                    <button type="button" className="secondaryButton" onClick={cancelEditing} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="primaryButton" disabled={saving}>
                      {saving ? "Saving…" : <>Save changes <span aria-hidden="true">→</span></>}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <dl className="infoList">
                    <div><dt>Email</dt><dd>{profile.email}</dd></div>
                    <div><dt>Phone</dt><dd>{profile.phone}</dd></div>
                    <div><dt>Account ID</dt><dd>{profile.id}</dd></div>
                  </dl>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setMessage("");
                    }}
                  >
                    Edit profile
                  </button>
                </>
              )}

              {message && (
                <p
                  className={messageType === "error" ? "formError" : "successMessage"}
                  role={messageType === "error" ? "alert" : "status"}
                >
                  {message}
                </p>
              )}
            </section>

            <section className="surface" aria-labelledby="current-pass">
              <h2 id="current-pass">Current digital pass</h2>
              <p className="hint">Your issued digital pass will appear here when available.</p>
              <Link className="secondaryButton" href="/member4/digital-pass">
                View pass history
              </Link>
            </section>
          </div>

          {/* Recent Searches */}
          <section className="surface" style={{ marginTop: "24px" }} aria-labelledby="recent-searches">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 id="recent-searches" style={{ margin: 0 }}>Recent Searches</h2>
              {searchHistory.length > 0 && (
                <button type="button" className="secondaryButton" onClick={clearHistory} style={{ fontSize: "12px", minHeight: "34px", padding: "0 12px" }}>
                  Clear all
                </button>
              )}
            </div>
            {searchHistory.length === 0 ? (
              <p className="hint">No searches yet. Search for a route on the home page and it will appear here.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "10px" }}>
                {searchHistory.map((entry, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 14px", border: "1px solid #e4eaeb", borderRadius: "12px", background: "#f9fafb" }}>
                    <div style={{ display: "grid", gap: "3px", minWidth: 0 }}>
                      <strong style={{ color: "#00343a", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entry.source} → {entry.destination}
                      </strong>
                      <span style={{ color: "#64748b", fontSize: "12px" }}>
                        {entry.crowdFilter !== "all" && <span style={{ background: "#e94b6520", color: "#e94b65", borderRadius: "4px", padding: "1px 6px", marginRight: "6px", fontWeight: 700 }}>{entry.crowdFilter}</span>}
                        {formatSearchDate(entry.searchedAt)}
                      </span>
                    </div>
                    <Link
                      href={`/home?src=${encodeURIComponent(entry.source)}&dst=${encodeURIComponent(entry.destination)}&crowd=${entry.crowdFilter}`}
                      className="secondaryButton"
                      style={{ fontSize: "12px", minHeight: "34px", padding: "0 12px", whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      Search again
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </>
        )}
      </div>
    </main>
  );
}
