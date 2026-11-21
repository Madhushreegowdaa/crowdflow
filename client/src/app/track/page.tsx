import type { Metadata } from "next";
import { Suspense } from "react";
import TrackPageClient from "@/features/passenger/track-page-client";

export const metadata: Metadata = {
  title: "Track Demo Bus",
  description: "View a simulated bus position and demo stop sequence.",
};

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24 text-slate-400 text-sm">
        Loading tracking data…
      </div>
    }>
      <TrackPageClient />
    </Suspense>
  );
}
