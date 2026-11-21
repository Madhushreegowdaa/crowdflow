"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AuthInput } from "../../member4/components/AuthInput";
import "../../member4/Member4.css";
import styles from "./AdminProfile.module.css";

export interface AdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  joinedAt: string;
}

type ProfileStatus = "ready" | "missing" | "error";

export function AdminProfileClient({ profile: initialProfile, initialStatus }: { profile: AdminProfile | null; initialStatus: ProfileStatus }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
  const [phone, setPhone] = useState(initialProfile?.phone ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const submissionInProgress = useRef(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    if (fullName.trim().length < 3) {
      setMessageType("error");
      setMessage("Please enter a valid full name (at least 3 characters).");
      return;
    }
    if (!/^\+?[0-9\s()-]{8,20}$/.test(phone.trim())) {
      setMessageType("error");
      setMessage("Please enter a valid phone number.");
      return;
    }

    submissionInProgress.current = true;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() }),
      });
      const result = await response.json() as { message?: string; profile?: AdminProfile };
      if (!response.ok || !result.profile) throw new Error(result.message || "We could not save your changes. Please try again.");

      setProfile(result.profile);
      setFullName(result.profile.fullName);
      setPhone(result.profile.phone);
      setEditing(false);
      setMessageType("success");
      setMessage("Your profile changes have been saved.");
      router.refresh();
    } catch (saveError) {
      setMessageType("error");
      setMessage(saveError instanceof Error ? saveError.message : "We could not save your changes. Please try again.");
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

  return <div className="memberMain">
    <div className="pageIntro">
      <div>
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Profile</h1>
        <p>Keep your administrator details up to date.</p>
      </div>
    </div>

    {initialStatus === "error" && <section className="surface" aria-live="polite"><p className="formError" role="alert">We could not load your profile. Please try again.</p><button className="secondaryButton" type="button" onClick={() => router.refresh()}>Try again</button></section>}
    {initialStatus === "missing" && <section className="surface" aria-live="polite"><h2>Profile unavailable</h2><p className="hint">We could not find an administrator profile for your account. Please contact support for help.</p></section>}
    {initialStatus === "ready" && profile && <div className={`contentGrid ${styles.profileGrid}`}>
      <section className="surface" aria-labelledby="profile-details">
        <h2 id="profile-details">Personal details</h2>
        <div className="profileHero">
          <div className="avatar" aria-hidden="true">{profile.fullName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{profile.fullName}</strong>
            <span>Administrator since {formatDate(profile.joinedAt)}</span>
          </div>
        </div>

        {editing ? <form className="editForm" onSubmit={save}>
          <AuthInput id="adminProfileName" label="Full name" value={fullName} onChange={event => { setFullName(event.target.value); setMessage(""); }} autoComplete="name" required disabled={saving} />
          <AuthInput id="adminProfilePhone" label="Phone number" value={phone} onChange={event => { setPhone(event.target.value); setMessage(""); }} autoComplete="tel" required disabled={saving} />
          <div className="inlineRow">
            <button type="button" className="secondaryButton" onClick={cancelEditing} disabled={saving}>Cancel</button>
            <button type="submit" className="primaryButton" disabled={saving}>{saving ? "Saving…" : <>Save changes <span aria-hidden="true">→</span></>}</button>
          </div>
        </form> : <>
          <dl className="infoList">
            <div><dt>Email</dt><dd>{profile.email}</dd></div>
            <div><dt>Phone</dt><dd>{profile.phone}</dd></div>
            <div><dt>Account created</dt><dd>{formatDate(profile.joinedAt)}</dd></div>
            <div><dt>Role</dt><dd>Administrator</dd></div>
          </dl>
          <button className="secondaryButton" type="button" onClick={() => { setEditing(true); setMessage(""); }}>Edit profile</button>
        </>}

        {message && <p className={messageType === "error" ? "formError" : "successMessage"} role={messageType === "error" ? "alert" : "status"}>{message}</p>}
      </section>
    </div>}
  </div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
