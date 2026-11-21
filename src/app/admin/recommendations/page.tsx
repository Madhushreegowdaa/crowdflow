"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  BusFront,
  Check,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";

const API_URL = "/admin-api/deployments";
const PREFERENCES_KEY = "crowdflow-admin-preferences-v1";

type Recommendation = {
  id: string;
  route_name: string;
  current_bus_count: number;
  recommended_bus_count: number;
  reason: string;
  priority: string;
  status: string;
  created_at: string;
};

type ApiResult = {
  success: boolean;
  message?: string;
  recommendations?: Recommendation[];
  threshold?: number;
};

async function readApiResponse(response: Response): Promise<ApiResult> {
  const result = (await response.json().catch(() => ({}))) as ApiResult;
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Request failed (${response.status}).`);
  }
  return result;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [threshold, setThreshold] = useState(85);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRecommendations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL, { cache: "no-store" });
      const result = await readApiResponse(response);
      setRecommendations(result.recommendations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load recommendations.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(PREFERENCES_KEY);
        if (saved) {
          const preferences = JSON.parse(saved) as { occupancyThreshold?: number };
          if (
            typeof preferences.occupancyThreshold === "number" &&
            preferences.occupancyThreshold >= 1 &&
            preferences.occupancyThreshold <= 100
          ) {
            setThreshold(preferences.occupancyThreshold);
          }
        }
      } catch {
        // Invalid local preferences fall back to the documented 85% default.
      }
      void loadRecommendations();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadRecommendations]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && busy === null) {
        void loadRecommendations(true);
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [busy, loadRecommendations]);

  const pendingCount = useMemo(
    () => recommendations.filter((item) => item.status.toLowerCase() === "pending").length,
    [recommendations]
  );
  const additionalBusCount = useMemo(
    () =>
      recommendations
        .filter((item) => item.status.toLowerCase() === "pending")
        .reduce(
          (total, item) => total + Math.max(0, item.recommended_bus_count - item.current_bus_count),
          0
        ),
    [recommendations]
  );

  async function generateRecommendations() {
    setBusy("generate");
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ occupancyThreshold: threshold }),
      });
      const result = await readApiResponse(response);
      setNotice(result.message || "Recommendations generated.");
      await loadRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate recommendations.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(id: string, action: "approve" | "reject") {
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_URL}/${encodeURIComponent(id)}/${action}`, {
        method: "PATCH",
      });
      await readApiResponse(response);
      setNotice(`Recommendation ${action === "approve" ? "approved" : "rejected"}.`);
      await loadRecommendations();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} recommendation.`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-[#172A30] px-7 py-9 text-white md:px-12 md:py-12">
        <div className="absolute -right-8 -top-16 h-72 w-72 rounded-full bg-[#E94F70]/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Intelligent Fleet Management
          </p>
          <h1 className="text-4xl font-bold md:text-5xl">Bus Deployment</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 md:text-base">
            Review deployment recommendations calculated from current bus passenger counts and capacity.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <BrainCircuit size={15} className="text-[#E94F70]" />
            Occupancy threshold: {threshold}%
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">Decision support</p>
          <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
            Deployment Recommendations
          </h2>
          <p className="mt-2 text-sm text-gray-500">Saved recommendations from the CrowdFlow backend.</p>
        </div>
        <button
          type="button"
          onClick={generateRecommendations}
          disabled={busy !== null || loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E94F70] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#D83E60] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "generate" ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
          {busy === "generate" ? "Generating…" : "Generate Recommendations"}
        </button>
      </section>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadRecommendations()} className="inline-flex shrink-0 items-center gap-2 font-semibold">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}
      {notice && <p role="status" className="rounded-xl border border-[#269D83]/20 bg-[#EAF5F1] p-4 text-sm text-[#176B59]">{notice}</p>}

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <SummaryCard icon={<AlertTriangle size={21} />} label="Pending decisions" value={pendingCount} color="text-[#E94F70]" bg="bg-[#FCEBF0]" />
        <SummaryCard icon={<BusFront size={21} />} label="Additional buses suggested" value={additionalBusCount} color="text-[#243F52]" bg="bg-[#EAF0F2]" />
        <SummaryCard icon={<Check size={21} />} label="Saved recommendations" value={recommendations.length} color="text-[#269D83]" bg="bg-[#EAF5F1]" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 md:p-6">
          <div>
            <h3 className="text-lg font-bold text-[#172A30]">Route recommendations</h3>
            <p className="mt-1 text-xs text-gray-500">Recommendations are updated from current fleet records.</p>
          </div>
          <button type="button" onClick={() => void loadRecommendations()} disabled={loading || busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-[#243F52] hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-gray-500"><LoaderCircle size={19} className="animate-spin" /> Loading recommendations…</div>
        ) : recommendations.length === 0 ? (
          <div className="p-12 text-center">
            <BusFront size={30} className="mx-auto text-[#243F52]/40" />
            <p className="mt-4 font-semibold text-[#172A30]">No saved recommendations</p>
            <p className="mt-1 text-sm text-gray-500">Generate recommendations from current bus occupancy.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recommendations.map((item) => {
              const isPending = item.status.toLowerCase() === "pending";
              const isBusy = busy === item.id;
              return (
                <article key={item.id} className="p-5 md:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#172A30]">{item.route_name || "Route not available"}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.priority.toLowerCase() === "high" ? "bg-[#FCEBF0] text-[#C83858]" : "bg-[#FFF3E2] text-[#9A6415]"}`}>
                          {item.priority} priority
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${isPending ? "bg-[#FFF3E2] text-[#9A6415]" : item.status.toLowerCase() === "approved" ? "bg-[#EAF5F1] text-[#176B59]" : "bg-gray-100 text-gray-600"}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-lg">
                        <Count label="Current buses" count={item.current_bus_count} />
                        <Count label="Recommended buses" count={item.recommended_bus_count} />
                      </div>
                      <p className="mt-4 text-sm leading-6 text-gray-600">{item.reason}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        Updated {item.created_at ? new Date(item.created_at).toLocaleString() : "time unavailable"}
                      </p>
                    </div>
                    {isPending && (
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => void updateStatus(item.id, "approve")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg bg-[#269D83] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#20856F] disabled:opacity-60">
                          {isBusy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} Approve
                        </button>
                        <button type="button" onClick={() => void updateStatus(item.id, "reject")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        Each recommendation shows the route occupancy and configured threshold used to calculate the suggested fleet size.
      </p>
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }: { icon: ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${color}`}>{icon}</div>
      <p className="mt-4 text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-[#172A30]">{value}</p>
    </div>
  );
}

function Count({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl bg-[#F8F8F7] p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#172A30]">{count}</p>
    </div>
  );
}
