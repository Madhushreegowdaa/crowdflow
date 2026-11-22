"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

interface PassRequest {
  id: string;
  user_id: string;
  pass_type: string;
  route_category: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

function fmt(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value :
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);
}

const statusConfig = {
  pending:  { label: "Pending",  bg: "bg-[#FFF3E2]", text: "text-[#B97719]", Icon: Clock },
  approved: { label: "Approved", bg: "bg-[#EAF5F1]", text: "text-[#269D83]", Icon: CheckCircle },
  rejected: { label: "Rejected", bg: "bg-[#FCEBF0]", text: "text-[#E94F70]", Icon: XCircle },
};

export default function PassManagementPage() {
  const [requests, setRequests] = useState<PassRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/pass-management");
      const json = await res.json() as { requests?: PassRequest[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load.");
      setRequests(json.requests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pass requests.");
    } finally {
      setLoading(false);
    }
  }

  // Initial load + Realtime subscription
  useEffect(() => {
    void load();

    const supabase = createClient();
    const channel = supabase
      .channel("admin-pass-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pass_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new as PassRequest;
            setRequests((prev) => {
              if (prev.some((r) => r.id === newRow.id)) return prev;
              return [newRow, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as PassRequest;
            setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r));
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setRequests((prev) => prev.filter((r) => r.id !== deleted.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { void supabase.removeChannel(channel); };
  }, []);

  async function updateStatus(requestId: string, newStatus: "approved" | "rejected") {
    setActionLoading(requestId);
    setActionMessage("");
    try {
      const res = await fetch("/api/admin/pass-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: newStatus }),
      });
      const json = await res.json() as { request?: PassRequest; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Action failed.");
      // Realtime will update the list; just show the message
      setActionMessage(newStatus === "approved" ? "Approved — digital pass issued to passenger." : "Request rejected.");
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const counts = {
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section
        className="relative flex min-h-[200px] items-end overflow-hidden rounded-2xl px-7 py-9 md:px-12"
        style={{ backgroundImage: "linear-gradient(90deg, rgba(23,42,48,0.92), rgba(23,42,48,0.48)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=85')" }}
      >
        <div className="relative z-10 text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">CrowdFlow / Pass Management</p>
          <h1 className="text-4xl font-bold">Bus Pass Applications</h1>
          <p className="mt-3 text-sm text-white/80">New requests appear automatically in real time.</p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(["pending", "approved", "rejected"] as const).map((s) => {
          const cfg = statusConfig[s];
          const Icon = cfg.Icon;
          return (
            <div key={s} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cfg.bg}`}>
                  <Icon size={20} className={cfg.text} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#172A30]">{counts[s]}</p>
                  <p className="text-xs text-gray-500">{cfg.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-5">
          <div>
            <h2 className="font-bold text-[#172A30]">All Applications</h2>
            <p className="mt-1 text-xs text-gray-500">{requests.length} total · live updates enabled</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f ? "bg-[#172A30] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={() => void load()} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#243F52] hover:bg-gray-50">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="border-b border-gray-100 bg-[#EAF5F1] px-5 py-3 text-sm font-medium text-[#269D83]">
            {actionMessage}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#269D83]" />
            <p className="mt-3 text-sm text-gray-500">Loading applications…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-[#E94F70]">{error}</p>
            <button onClick={() => void load()} className="mt-3 text-xs font-semibold text-[#243F52] underline">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-[#172A30]">No {filter === "all" ? "" : filter} applications</p>
            <p className="mt-1 text-xs text-gray-400">New requests will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((req) => {
              const cfg = statusConfig[req.status];
              const Icon = cfg.Icon;
              const isActing = actionLoading === req.id;
              return (
                <div key={req.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#172A30]">{req.pass_type}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
                        <Icon size={11} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{req.route_category}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      User: <span className="font-mono">{req.user_id.slice(0, 8)}…</span> · {fmt(req.created_at)}
                    </p>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => void updateStatus(req.id, "approved")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 rounded-lg bg-[#EAF5F1] px-3 py-2 text-xs font-bold text-[#269D83] transition hover:bg-[#269D83] hover:text-white disabled:opacity-60"
                      >
                        <CheckCircle size={14} />
                        {isActing ? "…" : "Approve"}
                      </button>
                      <button
                        onClick={() => void updateStatus(req.id, "rejected")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 rounded-lg bg-[#FCEBF0] px-3 py-2 text-xs font-bold text-[#E94F70] transition hover:bg-[#E94F70] hover:text-white disabled:opacity-60"
                      >
                        <XCircle size={14} />
                        {isActing ? "…" : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
