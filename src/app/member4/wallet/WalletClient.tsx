"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { DigitalPassCard, getPassDisplayStatus } from "../components/DigitalPassCard";
import { PassengerNavigation } from "../components/PassengerNavigation";
import type { DigitalPass } from "../../../../member4/types";
import "../Member4.css";

// ── Types ──────────────────────────────────────────────────────────────────

type VerificationStatus = "not_verified" | "pending" | "verified";

interface Verification {
  id: string;
  verification_status: VerificationStatus;
  masked_reference: string | null;
  verified_at: string | null;
  created_at: string;
}

interface TravelDocument {
  id: string;
  document_name: string;
  category: "student_id" | "concession_proof" | "other";
  file_path: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  status: "uploaded" | "under_review" | "accepted" | "rejected";
  uploaded_at: string;
}

interface WalletClientProps {
  passes: DigitalPass[];
  passError?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value :
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

function fmtDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value :
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

const categoryLabels: Record<TravelDocument["category"], string> = {
  student_id: "Student ID",
  concession_proof: "Concession Proof",
  other: "Other",
};

const docStatusLabels: Record<TravelDocument["status"], string> = {
  uploaded: "Uploaded",
  under_review: "Under Review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const verificationLabels: Record<VerificationStatus, string> = {
  not_verified: "Not Verified",
  pending: "Pending Review",
  verified: "Verified",
};

// ── Component ──────────────────────────────────────────────────────────────

export function WalletClient({ passes, passError }: WalletClientProps) {
  const [now] = useState(() => new Date());

  // Verification state
  const [verification, setVerification] = useState<Verification | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [maskedRef, setMaskedRef] = useState("XXXX-XXXX-");
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyMessageType, setVerifyMessageType] = useState<"success" | "error">("success");
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState("");
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<TravelDocument["category"]>("student_id");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadMessageType, setUploadMessageType] = useState<"success" | "error">("success");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activePass = passes.find((p) => getPassDisplayStatus(p, now) === "active");

  useEffect(() => {
    if (!docPreviewUrl) return;
    return () => URL.revokeObjectURL(docPreviewUrl);
  }, [docPreviewUrl]);

  // Load verification + documents on mount
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/member4/wallet-verification");
        const json = await res.json() as { verification?: Verification; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        setVerification(json.verification ?? null);
      } catch {
        setVerificationError("Could not load verification status.");
      } finally {
        setVerificationLoading(false);
      }
    })();

    void (async () => {
      try {
        const res = await fetch("/api/member4/travel-documents");
        const json = await res.json() as { documents?: TravelDocument[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? "Failed to load");
        setDocuments(json.documents ?? []);
      } catch {
        setDocsError("Could not load documents.");
      } finally {
        setDocsLoading(false);
      }
    })();
  }, []);

  // ── Verification submit ──────────────────────────────────────────────────
  async function submitVerification(e: FormEvent) {
    e.preventDefault();
    setVerifySubmitting(true);
    setVerifyMessage("");
    try {
      const res = await fetch("/api/member4/wallet-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maskedReference: maskedRef }),
      });
      const json = await res.json() as { verification?: Verification; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Submission failed.");
      setVerification(json.verification ?? null);
      setVerifyMessageType("success");
      setVerifyMessage("Verification request submitted. Pending admin review.");
      setShowVerifyForm(false);
    } catch (err) {
      setVerifyMessageType("error");
      setVerifyMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setVerifySubmitting(false);
    }
  }

  // ── Document upload ──────────────────────────────────────────────────────
  async function submitUpload(e: FormEvent) {
    e.preventDefault();
    if (!docFile) return;
    setUploadSubmitting(true);
    setUploadMessage("");
    try {
      const fd = new FormData();
      fd.append("documentName", docName);
      fd.append("category", docCategory);
      fd.append("file", docFile);
      const res = await fetch("/api/member4/travel-documents", { method: "POST", body: fd });
      const json = await res.json() as { document?: TravelDocument; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setDocuments((prev) => [json.document!, ...prev]);
      setDocName("");
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadMessageType("success");
      setUploadMessage("Document uploaded successfully.");
    } catch (err) {
      setUploadMessageType("error");
      setUploadMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadSubmitting(false);
    }
  }

  // ── Document delete ──────────────────────────────────────────────────────
  async function deleteDocument(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/member4/travel-documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Delete failed.");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setDocsError("Could not delete document. Please try again.");
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="memberPage">
      <PassengerNavigation activePage="wallet" />

      <div className="memberMain">
        <div className="pageIntro">
          <div>
            <p className="eyebrow">TRAVEL WALLET</p>
            <h1>My Travel Wallet</h1>
            <p>Your identity, passes, and travel documents in one place.</p>
          </div>
          <Link className="secondaryButton" href="/member4/profile">Back to profile</Link>
        </div>

        <section className="surface walletDemoSection" aria-label="Sample identity and travel pass cards">
          <div className="walletDemoGrid">
            <article className="walletDemoCard walletDemoIdentity" aria-label="Fictional Aadhaar demo card">
              <div className="walletDemoCardTop">
                <span>IDENTITY CARD · DEMO</span>
                <strong>NOT OFFICIAL ID</strong>
              </div>
              <div className="walletDemoIdentityBody">
                <div className="walletDemoAvatar" aria-hidden="true">D</div>
                <div>
                  <span className="walletDemoLabel">Name</span>
                  <strong>Demo Passenger</strong>
                  <span className="walletDemoLabel">Aadhaar preview · masked</span>
                  <strong className="walletDemoNumber">XXXX XXXX 0000</strong>
                </div>
              </div>
              <div className="walletDemoCardFoot">
                <span>Mangaluru, Karnataka</span>
                <span>FICTIONAL SAMPLE</span>
              </div>
            </article>

            <article className="walletDemoCard walletDemoPass" aria-label="Fictional bus pass demo card">
              <div className="walletDemoCardTop">
                <span>CROWDFLOW · TRAVEL PASS</span>
                <strong>NOT VALID</strong>
              </div>
              <h3>Monthly Student Pass</h3>
              <p className="walletDemoPassenger">Demo Passenger</p>
              <div className="walletDemoPassDetails">
                <div>
                  <span className="walletDemoLabel">Route</span>
                  <strong>BC Road ↔ Mangaluru</strong>
                </div>
                <div>
                  <span className="walletDemoLabel">Pass ID</span>
                  <strong>CF-DEMO-2048</strong>
                </div>
                <div>
                  <span className="walletDemoLabel">Valid until</span>
                  <strong>31 Dec 2026</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* ── A. Identity Verification ── */}
        <section className="surface" style={{ marginBottom: 24 }} aria-labelledby="wallet-id-heading">
          <h2 id="wallet-id-heading">Identity Verification</h2>
          <p className="hint" style={{ marginBottom: 18 }}>
            Mock Aadhaar verification for prototype. Only the last 4 digits are stored — no full number or card image is ever collected.
          </p>

          {verificationLoading ? (
            <p className="hint" role="status">Loading…</p>
          ) : verificationError ? (
            <p className="formError" role="alert">{verificationError}</p>
          ) : (
            <>
              <dl className="infoList" style={{ marginBottom: 20 }}>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span className={`statusBadge ${
                      verification?.verification_status === "verified" ? "" :
                      verification?.verification_status === "pending" ? "statusPending" : "statusExpired"
                    }`}>
                      <span className="statusDot" aria-hidden="true" />
                      {verificationLabels[verification?.verification_status ?? "not_verified"]}
                    </span>
                  </dd>
                </div>
                {verification?.masked_reference && (
                  <div><dt>Reference</dt><dd>{verification.masked_reference}</dd></div>
                )}
                {verification?.verified_at && (
                  <div><dt>Verified on</dt><dd>{fmt(verification.verified_at)}</dd></div>
                )}
                {verification?.created_at && (
                  <div><dt>Submitted</dt><dd>{fmt(verification.created_at)}</dd></div>
                )}
              </dl>

              {verification?.verification_status !== "verified" && !showVerifyForm && (
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => setShowVerifyForm(true)}
                >
                  {verification?.verification_status === "pending" ? "Resubmit verification" : "Start verification"}
                </button>
              )}

              {showVerifyForm && (
                <form onSubmit={(e) => void submitVerification(e)} style={{ marginTop: 16, display: "grid", gap: 14, maxWidth: 420 }}>
                  <div className="field">
                    <label htmlFor="maskedRef">Aadhaar last 4 digits (format: XXXX-XXXX-1234)</label>
                    <input
                      id="maskedRef"
                      className="passRequestSelect"
                      value={maskedRef}
                      onChange={(e) => setMaskedRef(e.target.value)}
                      placeholder="XXXX-XXXX-1234"
                      maxLength={14}
                      required
                      disabled={verifySubmitting}
                    />
                    <p className="hint">Only the last 4 digits are stored. This is a prototype mock verification.</p>
                  </div>
                  <div className="inlineRow">
                    <button type="button" className="secondaryButton" onClick={() => setShowVerifyForm(false)} disabled={verifySubmitting}>Cancel</button>
                    <button type="submit" className="primaryButton" disabled={verifySubmitting} style={{ flex: 1 }}>
                      {verifySubmitting ? "Submitting…" : <><span>Submit for review</span><span aria-hidden="true">→</span></>}
                    </button>
                  </div>
                </form>
              )}

              {verifyMessage && (
                <p className={verifyMessageType === "error" ? "formError" : "successMessage"} role={verifyMessageType === "error" ? "alert" : "status"} style={{ marginTop: 12 }}>
                  {verifyMessage}
                </p>
              )}
            </>
          )}
        </section>

        {/* ── B & C. Bus Pass + Digital Pass ── */}
        <div className="contentGrid" style={{ marginBottom: 24 }}>

          {/* B. Bus Pass (application status) */}
          <section className="surface" aria-labelledby="wallet-pass-heading">
            <h2 id="wallet-pass-heading">Bus Pass</h2>
            {passError ? (
              <p className="formError" role="alert">{passError}</p>
            ) : activePass ? (
              <>
                <dl className="infoList" style={{ marginBottom: 20 }}>
                  <div><dt>Pass ID</dt><dd style={{ fontFamily: "monospace", fontSize: 12 }}>{activePass.id}</dd></div>
                  <div><dt>Pass type</dt><dd>{activePass.type}</dd></div>
                  <div><dt>Valid from</dt><dd>{fmtDate(activePass.validFrom)}</dd></div>
                  <div><dt>Valid until</dt><dd>{fmtDate(activePass.validUntil)}</dd></div>
                  <div><dt>Travel category</dt><dd>{activePass.routeCategory || "—"}</dd></div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span className="statusBadge">
                        <span className="statusDot" aria-hidden="true" />
                        Active
                      </span>
                    </dd>
                  </div>
                </dl>
                <Link className="secondaryButton" href="/member4/digital-pass">View full pass</Link>
              </>
            ) : (
              <div className="emptyState">
                <p>No active bus pass. Apply for one below.</p>
                <Link className="secondaryButton" href="/member4/digital-pass" style={{ marginTop: 14, display: "inline-flex" }}>
                  Apply for a pass
                </Link>
              </div>
            )}
          </section>

          {/* C. Digital Bus Pass */}
          <section className="surface" aria-labelledby="wallet-digital-heading">
            <h2 id="wallet-digital-heading">Digital Bus Pass</h2>
            {passError ? (
              <p className="formError" role="alert">{passError}</p>
            ) : activePass ? (
              <>
                <DigitalPassCard pass={activePass} compact now={now} />
                <Link className="secondaryButton" href="/member4/digital-pass" style={{ marginTop: 16, display: "inline-flex" }}>
                  View pass &amp; QR code
                </Link>
              </>
            ) : (
              <div className="emptyState">
                <p>Your digital pass will appear here once a pass request is approved.</p>
              </div>
            )}
          </section>
        </div>

        {/* ── D. Travel Documents ── */}
        <section className="surface" aria-labelledby="wallet-docs-heading">
          <h2 id="wallet-docs-heading">Other Travel Documents</h2>
          <p className="hint" style={{ marginBottom: 20 }}>
            Upload supporting documents such as a student ID or concession eligibility proof. Only JPEG, PNG, or PDF files under 5 MB are accepted. Maximum 10 documents.
          </p>

          {/* Upload form */}
          <form onSubmit={(e) => void submitUpload(e)} style={{ display: "grid", gap: 14, maxWidth: 560, marginBottom: 28 }}>
            <div className="field">
              <label htmlFor="docName">Document name</label>
              <input
                id="docName"
                className="passRequestSelect"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. College Student ID"
                maxLength={120}
                required
                disabled={uploadSubmitting}
              />
            </div>
            <div className="field">
              <label htmlFor="docCategory">Category</label>
              <select
                id="docCategory"
                className="passRequestSelect"
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as TravelDocument["category"])}
                disabled={uploadSubmitting}
                required
              >
                <option value="student_id">Student ID</option>
                <option value="concession_proof">Concession Proof</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="docFile">File (JPEG, PNG, or PDF · max 5 MB)</label>
              <input
                id="docFile"
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                className="passRequestSelect"
                style={{ padding: "10px 14px", height: "auto" }}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setDocFile(file);
                  setDocPreviewUrl(file?.type.startsWith("image/") ? URL.createObjectURL(file) : null);
                }}
                required
                disabled={uploadSubmitting}
              />
            </div>
            {docPreviewUrl && docFile && (
              <div className="travelDocumentUploadPreview">
                <Image
                  src={docPreviewUrl}
                  alt={`Preview of ${docFile.name}`}
                  width={120}
                  height={150}
                  unoptimized
                />
                <span>Photo preview</span>
              </div>
            )}
            <button
              type="submit"
              className="primaryButton"
              disabled={uploadSubmitting || !docFile || !docName.trim()}
              style={{ maxWidth: 200 }}
            >
              {uploadSubmitting ? "Uploading…" : <><span>Upload document</span><span aria-hidden="true">→</span></>}
            </button>
          </form>

          {uploadMessage && (
            <p className={uploadMessageType === "error" ? "formError" : "successMessage"} role={uploadMessageType === "error" ? "alert" : "status"} style={{ marginBottom: 20 }}>
              {uploadMessage}
            </p>
          )}

          {/* Document list */}
          {docsLoading ? (
            <p className="hint" role="status">Loading documents…</p>
          ) : docsError ? (
            <p className="formError" role="alert">{docsError}</p>
          ) : documents.length === 0 ? (
            <div className="emptyState">
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <ul className="passRequestList" aria-label="Your travel documents">
              {documents.map((doc) => (
                <li key={doc.id} className="passRequestItem">
                  {doc.mime_type?.startsWith("image/") ? (
                    <a
                      className="travelDocumentPreviewLink"
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        className="travelDocumentPreview"
                        src={doc.file_url}
                        alt={`Uploaded ${doc.document_name}`}
                        width={96}
                        height={112}
                        unoptimized
                      />
                    </a>
                  ) : (
                    <a
                      className="secondaryButton"
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PDF
                    </a>
                  )}
                  <div className="passRequestDetails">
                    <strong>{doc.document_name}</strong>
                    <span>{categoryLabels[doc.category]}</span>
                    <span>Uploaded {fmt(doc.uploaded_at)}{doc.file_size_bytes ? ` · ${(doc.file_size_bytes / 1024).toFixed(0)} KB` : ""}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span className={`statusBadge ${doc.status === "accepted" ? "" : doc.status === "rejected" ? "statusExpired" : "statusPending"}`}>
                      <span className="statusDot" aria-hidden="true" />
                      {docStatusLabels[doc.status]}
                    </span>
                    {deleteConfirmId === doc.id ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="secondaryButton"
                          style={{ fontSize: 12, minHeight: 34, padding: "0 10px", borderColor: "#e94b65", color: "#bd2944" }}
                          onClick={() => void deleteDocument(doc.id)}
                          disabled={deleting}
                        >
                          {deleting ? "Deleting…" : "Confirm delete"}
                        </button>
                        <button type="button" className="secondaryButton" style={{ fontSize: 12, minHeight: 34, padding: "0 10px" }} onClick={() => setDeleteConfirmId(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="secondaryButton"
                        style={{ fontSize: 12, minHeight: 34, padding: "0 10px" }}
                        onClick={() => setDeleteConfirmId(doc.id)}
                        aria-label={`Delete ${doc.document_name}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
