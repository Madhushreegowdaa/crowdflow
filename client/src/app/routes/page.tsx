import type { Metadata } from "next";
import RoutesPageClient from "@/features/passenger/routes-page-client";

export const metadata: Metadata = {
  title: "Routes",
  description: "Browse all bus routes, stops and timetables.",
};

export default function RoutesPage() {
  return <RoutesPageClient />;
}
