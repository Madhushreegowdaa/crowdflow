
"use client";

import { useState } from "react";
import {
  Settings,
  User,
  Bell,
  ShieldCheck,
  BusFront,
  Gauge,
  Save,
  Mail,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [adminName, setAdminName] = useState("Administrator");
  const [email, setEmail] = useState("admin@crowdflow.com");
  const [notifications, setNotifications] = useState({
    crowd: true,
    delay: true,
    speed: true,
    deployment: false,
  });
  const [speedLimit, setSpeedLimit] = useState("60");
  const [capacityLimit, setCapacityLimit] = useState("85");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section
        className="relative flex min-h-[270px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.95), rgba(23,42,48,0.45)), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Configuration
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Admin Settings
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Manage administrator preferences, notification options
            and transport monitoring configurations.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <Settings size={14} className="text-[#E94F70]" />
            System configuration
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Control centre
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
          Preferences & Configuration
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Configure how the CrowdFlow administration portal behaves.
        </p>
      </section>

      {/* PROFILE SETTINGS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F2] text-[#243F52]">
            <User size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#172A30]">
              Administrator Profile
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Manage your account information
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">
              Administrator Name
            </label>

            <input
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] px-4 py-3 text-sm text-[#172A30] outline-none focus:border-[#243F52]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] py-3 pl-10 pr-4 text-sm text-[#172A30] outline-none focus:border-[#243F52]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* NOTIFICATION SETTINGS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCEBF0] text-[#E94F70]">
            <Bell size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#172A30]">
              Notification Preferences
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Choose which transport alerts you want enabled
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {[
            {
              key: "crowd" as const,
              title: "High Crowd Notifications",
              description: "Receive alerts when passenger occupancy is high.",
            },
            {
              key: "delay" as const,
              title: "Bus Delay Notifications",
              description: "Receive notifications about delayed buses.",
            },
            {
              key: "speed" as const,
              title: "Speed Violation Notifications",
              description: "Receive alerts when buses exceed the configured speed limit.",
            },
            {
              key: "deployment" as const,
              title: "Deployment Recommendations",
              description: "Receive suggestions for additional bus deployment.",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-semibold text-[#172A30]">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.description}
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={notifications[item.key]}
                onClick={() => {
                  setNotifications((current) => ({
                    ...current,
                    [item.key]: !current[item.key],
                  }));
                  setSaved(false);
                }}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  notifications[item.key]
                    ? "bg-[#269D83]"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                    notifications[item.key]
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FLEET CONFIGURATION */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5F1] text-[#269D83]">
            <BusFront size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#172A30]">
              Fleet Monitoring Configuration
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Configure demonstration monitoring thresholds
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
              <Gauge size={15} />
              Speed Alert Limit (km/h)
            </label>

            <input
              type="number"
              min="1"
              value={speedLimit}
              onChange={(e) => {
                setSpeedLimit(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] px-4 py-3 text-sm text-[#172A30] outline-none focus:border-[#243F52]"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-600">
              <UsersIcon />
              High Crowd Threshold (%)
            </label>

            <input
              type="number"
              min="1"
              max="100"
              value={capacityLimit}
              onChange={(e) => {
                setCapacityLimit(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-gray-200 bg-[#F8F8F7] px-4 py-3 text-sm text-[#172A30] outline-none focus:border-[#243F52]"
            />
          </div>
        </div>
      </section>

      {/* SYSTEM INFORMATION */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F2] text-[#243F52]">
            <ShieldCheck size={22} />
          </div>

          <div>
            <h3 className="font-bold text-[#172A30]">
              System Information
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              CrowdFlow project environment
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-sm text-gray-500">Application</span>
            <span className="text-sm font-semibold text-[#172A30]">
              CrowdFlow
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-sm text-gray-500">Portal</span>
            <span className="text-sm font-semibold text-[#172A30]">
              Administrator
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-sm text-gray-500">Location</span>
            <span className="flex items-center gap-1 text-sm font-semibold text-[#172A30]">
              <MapPin size={14} />
              Mangaluru
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Environment</span>
            <span className="rounded-full bg-[#FFF3E2] px-3 py-1 text-xs font-semibold text-[#B97719]">
              Development / Demo
            </span>
          </div>
        </div>
      </section>

      {/* SAVE BUTTON */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#172A30] p-5 md:flex-row md:items-center">
        <div>
          <h3 className="font-bold text-white">
            Save Configuration
          </h3>

          <p className="mt-1 text-xs text-white/60">
            Save your current settings for this page session.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-[#E94F70] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#D83E60]"
        >
          {saved ? (
            <>
              <CheckCircle2 size={17} />
              Saved for this session
            </>
          ) : (
            <>
              <Save size={17} />
              Save Settings
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> Settings currently remain in the
        browser page state and are not stored in the database.
        They will be connected to administrator authentication
        and backend configuration during integration.
      </div>
    </div>
  );
}

function UsersIcon() {
  return <Users size={15} />;
}

function Users() {
  return null;
}
