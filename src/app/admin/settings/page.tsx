"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Gauge, Save, Settings } from "lucide-react";

const PREFERENCES_KEY = "crowdflow-admin-preferences-v1";

export default function SettingsPage() {
  const [occupancyThreshold, setOccupancyThreshold] = useState(85);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (stored) {
          const preferences = JSON.parse(stored) as { occupancyThreshold?: unknown };
          const value = Number(preferences.occupancyThreshold);
          if (Number.isFinite(value) && value >= 1 && value <= 100) {
            setOccupancyThreshold(value);
          }
        }
      } catch {
        setError("Unable to load settings.");
      } finally {
        setLoaded(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  function saveSettings() {
    try {
      const existing = localStorage.getItem(PREFERENCES_KEY);
      const preferences = existing ? JSON.parse(existing) as Record<string, unknown> : {};
      localStorage.setItem(
        PREFERENCES_KEY,
        JSON.stringify({ ...preferences, occupancyThreshold })
      );
      setSaved(true);
      setError("");
    } catch {
      setSaved(false);
      setError("Unable to save settings.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative flex min-h-[250px] items-end overflow-hidden rounded-2xl bg-[#172A30] px-7 py-9 text-white md:px-12 md:py-12">
        <div className="absolute -right-8 -top-16 h-72 w-72 rounded-full bg-[#E94F70]/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">CrowdFlow / Configuration</p>
          <h1 className="text-4xl font-bold md:text-5xl">Admin Settings</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/75 md:text-base">
            Configure the crowd threshold used by bus deployment recommendations.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <Settings size={14} className="text-[#E94F70]" /> Deployment configuration
          </div>
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">Control centre</p>
        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">Deployment Threshold</h2>
        <p className="mt-2 text-sm text-gray-500">Recommendations use this threshold to identify routes that need additional buses.</p>
      </section>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5F1] text-[#269D83]"><Gauge size={22} /></div>
          <div>
            <h3 className="font-bold text-[#172A30]">High Crowd Threshold</h3>
            <p className="mt-1 text-xs text-gray-500">Routes at or above this occupancy level are considered for more buses.</p>
          </div>
        </div>
        <div className="mt-5 max-w-md">
          <label htmlFor="occupancy-threshold" className="mb-2 block text-xs font-semibold text-gray-600">Occupancy threshold (%)</label>
          <input
            id="occupancy-threshold"
            type="number"
            min="1"
            max="100"
            value={occupancyThreshold}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value) && value >= 1 && value <= 100) {
                setOccupancyThreshold(value);
                setSaved(false);
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] px-4 py-3 text-sm text-[#172A30] outline-none focus:border-[#243F52]"
          />
        </div>
      </section>

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#172A30] p-5 md:flex-row md:items-center">
        <div>
          <h3 className="font-bold text-white">Save Settings</h3>
          <p className="mt-1 text-xs text-white/60">The saved threshold is used when generating recommendations.</p>
        </div>
        <button type="button" onClick={saveSettings} disabled={!loaded} className="flex items-center gap-2 rounded-lg bg-[#E94F70] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#D83E60] disabled:opacity-60">
          {saved ? <><CheckCircle2 size={17} /> Saved</> : <><Save size={17} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
