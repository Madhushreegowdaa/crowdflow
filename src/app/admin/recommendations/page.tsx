
"use client";

import { useState } from "react";
import {
  BrainCircuit,
  BusFront,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
} from "lucide-react";

const initialRecommendations = [
  {
    id: 1,
    route: "Mangaluru - Udupi",
    location: "Surathkal",
    demand: 145,
    capacity: 100,
    currentBuses: 8,
    additionalBuses: 2,
    priority: "High",
    reason: "Predicted passenger demand exceeds available capacity.",
    time: "Morning peak",
  },
  {
    id: 2,
    route: "Mangaluru - Surathkal",
    location: "Kottara Chowki",
    demand: 125,
    capacity: 100,
    currentBuses: 6,
    additionalBuses: 1,
    priority: "High",
    reason: "Increasing passenger demand may cause overcrowding.",
    time: "Evening peak",
  },
  {
    id: 3,
    route: "State Bank - Pumpwell",
    location: "Kankanady",
    demand: 95,
    capacity: 100,
    currentBuses: 5,
    additionalBuses: 0,
    priority: "Moderate",
    reason: "Current capacity appears sufficient, but demand should be monitored.",
    time: "Afternoon",
  },
];

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] =
    useState(initialRecommendations);

  const [deployed, setDeployed] = useState<number[]>([]);

  const handleDeploy = (id: number) => {
    setDeployed((current) => [...current, id]);
  };

  const pending = recommendations.filter(
    (item) => !deployed.includes(item.id)
  );

  return (
    <div className="space-y-8">

      {/* HERO */}
      <section
        className="relative flex min-h-[280px] items-end overflow-hidden rounded-2xl bg-cover bg-center px-7 py-9 md:px-12 md:py-12"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,42,48,0.95), rgba(23,42,48,0.48)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <div className="relative max-w-2xl text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#E94F70]">
            CrowdFlow / Intelligent Fleet Management
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Smart Bus Deployment
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
            Use passenger demand insights to identify routes that
            may need additional buses and support better fleet allocation.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
            <BrainCircuit size={15} className="text-[#E94F70]" />
            Demonstration AI recommendations
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E94F70]">
          Decision support
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#172A30] md:text-3xl">
          Fleet Deployment Recommendations
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Review predicted demand and suggested additional bus requirements.
        </p>
      </section>

      {/* SUMMARY */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FCEBF0] text-[#E94F70]">
            <AlertTriangle size={22} />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            High Priority Routes
          </p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {recommendations.filter((r) => r.priority === "High").length}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF0F2] text-[#243F52]">
            <BusFront size={22} />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Suggested Additional Buses
          </p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {pending.reduce((sum, r) => sum + r.additionalBuses, 0)}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5F1] text-[#269D83]">
            <CheckCircle2 size={22} />
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Deployment Actions
          </p>
          <h3 className="mt-1 text-3xl font-bold text-[#172A30]">
            {deployed.length}
          </h3>
        </div>
      </section>

      {/* AI EXPLANATION */}
      <section className="overflow-hidden rounded-2xl bg-[#172A30] p-6 text-white md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#E94F70]">
            <Sparkles size={25} />
          </div>

          <div>
            <h3 className="text-lg font-bold">
              How Smart Deployment Works
            </h3>
            <p className="mt-1 text-xs text-white/60">
              CrowdFlow recommendation workflow
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <Users className="text-[#E94F70]" size={22} />
            <h4 className="mt-3 text-sm font-bold">
              1. Analyse Demand
            </h4>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Analyse current and predicted passenger demand on each route.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <TrendingUp className="text-[#269D83]" size={22} />
            <h4 className="mt-3 text-sm font-bold">
              2. Identify Shortages
            </h4>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Compare expected demand with the available transport capacity.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <BusFront className="text-[#E59A3B]" size={22} />
            <h4 className="mt-3 text-sm font-bold">
              3. Recommend Buses
            </h4>
            <p className="mt-2 text-xs leading-5 text-white/60">
              Suggest additional buses where capacity may be insufficient.
            </p>
          </div>
        </div>
      </section>

      {/* RECOMMENDATION LIST */}
      <section className="space-y-5">
        <div>
          <h3 className="text-xl font-bold text-[#172A30]">
            Recommended Deployments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Review the route-wise recommendations below.
          </p>
        </div>

        {recommendations.map((item) => {
          const isDeployed = deployed.includes(item.id);

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-5 p-5 md:p-6">

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF0F2] text-[#243F52]">
                      <BusFront size={23} />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        Recommendation #{item.id}
                      </p>
                      <h4 className="mt-1 font-bold text-[#172A30]">
                        {item.route}
                      </h4>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={13} />
                        {item.location}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      item.priority === "High"
                        ? "bg-[#FCEBF0] text-[#E94F70]"
                        : "bg-[#FFF3E2] text-[#B97719]"
                    }`}
                  >
                    {item.priority} Priority
                  </span>
                </div>

                {/* DEMAND AND CAPACITY */}
                <div className="grid grid-cols-2 gap-4 rounded-xl bg-[#F8F8F7] p-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Predicted demand</p>
                    <p className="mt-1 text-xl font-bold text-[#172A30]">
                      {item.demand}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Available capacity</p>
                    <p className="mt-1 text-xl font-bold text-[#172A30]">
                      {item.capacity}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Current buses</p>
                    <p className="mt-1 text-xl font-bold text-[#172A30]">
                      {item.currentBuses}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Suggested buses</p>
                    <p className="mt-1 text-xl font-bold text-[#E94F70]">
                      +{item.additionalBuses}
                    </p>
                  </div>
                </div>

                {/* DEMAND BAR */}
                <div>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="font-medium text-gray-500">
                      Predicted demand relative to capacity
                    </span>
                    <span className="font-bold text-[#E94F70]">
                      {item.demand}% of capacity
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#E94F70]"
                      style={{
                        width: `${Math.min(item.demand, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-gray-400">
                    Values above 100% indicate predicted demand exceeds
                    available capacity, not physical bus occupancy.
                  </p>
                </div>

                {/* REASON AND ACTION */}
                <div className="flex flex-col justify-between gap-4 border-t border-gray-100 pt-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#243F52]">
                      Recommendation reason
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {item.reason}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock size={13} />
                      {item.time}
                    </p>
                  </div>

                  <button
                    disabled={isDeployed || item.additionalBuses === 0}
                    onClick={() => handleDeploy(item.id)}
                    className={`flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-xs font-bold transition ${
                      isDeployed
                        ? "cursor-default bg-[#EAF5F1] text-[#269D83]"
                        : item.additionalBuses === 0
                        ? "cursor-default bg-gray-100 text-gray-400"
                        : "bg-[#E94F70] text-white hover:bg-[#D83E60]"
                    }`}
                  >
                    {isDeployed ? (
                      <>
                        <CheckCircle2 size={15} />
                        Action Recorded
                      </>
                    ) : item.additionalBuses === 0 ? (
                      "No Deployment Needed"
                    ) : (
                      <>
                        <Plus size={15} />
                        Record Deployment Action
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* NOTE */}
      <div className="rounded-xl border border-[#243F52]/10 bg-[#EAF0F2] p-4 text-sm leading-6 text-[#243F52]">
        <strong>Demo mode:</strong> All demand predictions and suggested
        bus counts are sample values. The deployment button only records
        a temporary action in this page; 
      </div>
    </div>
  );
}
