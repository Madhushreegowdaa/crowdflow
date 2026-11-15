
"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  BusFront,
  Users,
  Gauge,
  CheckCircle2,
  Bell,
  MapPin,
  Filter,
} from "lucide-react";

const initialAlerts = [
  {
    id: 1,
    bus: "BUS102",
    route: "Mangaluru - Udupi",
    type: "High Crowd",
    description: "Passenger occupancy has reached 92%.",
    time: "10:35 AM",
    location: "Surathkal",
    severity: "High",
    icon: Users,
  },
  {
    id: 2,
    bus: "BUS103",
    route: "State Bank - Pumpwell",
    type: "Bus Delayed",
    description: "Bus is running behind its scheduled arrival.",
    time: "10:20 AM",
    location: "Kankanady",
    severity: "Medium",
    icon: Clock,
  },
  {
    id: 3,
    bus: "BUS105",
    route: "Mangaluru - Surathkal",
    type: "Speed Alert",
    description: "Vehicle speed exceeded the configured limit.",
    time: "09:55 AM",
    location: "Kuloor",
    severity: "High",
    icon: Gauge,
  },
  {
    id: 4,
    bus: "BUS101",
    route: "Mangaluru - Surathkal",
    type: "High Crowd",
    description: "Passenger occupancy is approaching the warning level.",
    time: "09:40 AM",
    location: "Hampankatta",
    severity: "Medium",
    icon: Users,
  },
  {
    id: 5,
    bus: "BUS104",
    route: "Mangaluru - Mulki",
    type: "Bus Delayed",
    description: "Bus arrival is later than the estimated time.",
    time: "09:15 AM",
    location: "Kottara Chowki",
    severity: "Low",
    icon: Clock,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState("All");

  const filteredAlerts =
    filter === "All"
      ? alerts
      : alerts.filter((alert) => alert.type === filter);

  const markResolved = (id: number) => {
    setAlerts((current) =>
      current.filter((alert) => alert.id !== id)
    );
  };

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section
        className="relative flex min-h-[270px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.95), rgba(23,42,48,0.45)), url('https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Monitoring
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Alerts & Notifications
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Stay informed about overcrowding, delayed buses and
            vehicle speed conditions across your transport network.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <Bell size={14} className="text-[#E94F70]" />
            Demonstration alerts
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Fleet monitoring
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
          Alert Centre
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Review transport issues and manage the displayed alerts.
        </p>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <AlertTriangle className="text-[#E94F70]" size={24} />
          <p className="mt-4 text-sm text-gray-500">High Priority</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {alerts.filter((a) => a.severity === "High").length}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <Clock className="text-[#E59A3B]" size={24} />
          <p className="mt-4 text-sm text-gray-500">Medium Priority</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {alerts.filter((a) => a.severity === "Medium").length}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <CheckCircle2 className="text-[#269D83]" size={24} />
          <p className="mt-4 text-sm text-gray-500">Remaining Alerts</p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {alerts.length}
          </h3>
        </div>
      </section>

      {/* FILTERS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#172A30]">
              Recent Alerts
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {filteredAlerts.length} alerts displayed
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="text-gray-400" />

            {["All", "High Crowd", "Bus Delayed", "Speed Alert"].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                    filter === item
                      ? "bg-[#172A30] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>
        </div>

        {/* ALERT LIST */}
        <div className="mt-5 space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => {
              const Icon = alert.icon;

              return (
                <div
                  key={alert.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-[#243F52]/30 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                        alert.severity === "High"
                          ? "bg-[#FCEBF0] text-[#E94F70]"
                          : alert.severity === "Medium"
                          ? "bg-[#FFF3E2] text-[#B97719]"
                          : "bg-[#EAF0F2] text-[#243F52]"
                      }`}
                    >
                      <Icon size={23} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-[#172A30]">
                          {alert.type}
                        </h4>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            alert.severity === "High"
                              ? "bg-[#FCEBF0] text-[#E94F70]"
                              : alert.severity === "Medium"
                              ? "bg-[#FFF3E2] text-[#B97719]"
                              : "bg-[#EAF0F2] text-[#243F52]"
                          }`}
                        >
                          {alert.severity} Priority
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {alert.description}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <BusFront size={13} />
                          {alert.bus}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin size={13} />
                          {alert.location}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {alert.time}
                        </span>
                      </div>

                      <p className="mt-2 text-xs font-medium text-[#243F52]">
                        {alert.route}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => markResolved(alert.id)}
                    className="shrink-0 rounded-lg bg-[#172A30] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#243F52]"
                  >
                    Mark Resolved
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto text-[#269D83]" size={35} />
              <p className="mt-3 font-semibold text-[#172A30]">
                No alerts found
              </p>
              <p className="mt-1 text-xs text-gray-500">
                No alerts match this filter.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* DEMO NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> Alert events and timestamps are sample
        data. Mark Resolved currently removes an alert from this page only.
        Actual alerts will be generated from backend GPS, speed and
        passenger occupancy data during integration.
      </div>
    </div>
  );
}
