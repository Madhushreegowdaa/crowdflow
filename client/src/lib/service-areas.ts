export type ServiceLocationKind = "bus stop" | "area reference";

export interface ServiceLocation {
  name: string;
  area: string;
  kind: ServiceLocationKind;
}

export const SERVICE_LOCATIONS: ServiceLocation[] = [
  { name: "Bengaluru", area: "Bengaluru", kind: "area reference" },
  { name: "Bengaluru Urban", area: "Bengaluru", kind: "area reference" },
  { name: "Majestic Bus Station", area: "Bengaluru", kind: "bus stop" },
  { name: "Corporation / Hudson Circle", area: "Bengaluru", kind: "bus stop" },
  { name: "Richmond Circle", area: "Bengaluru", kind: "bus stop" },
  { name: "Domlur TTMC", area: "Bengaluru", kind: "bus stop" },
  { name: "HAL Main Gate", area: "Bengaluru", kind: "bus stop" },
  { name: "Marathahalli Bridge", area: "Bengaluru", kind: "bus stop" },
  { name: "Kundalahalli Gate", area: "Bengaluru", kind: "bus stop" },
  { name: "ITPL / Whitefield TTMC", area: "Bengaluru", kind: "bus stop" },
  { name: "Silk Board Junction", area: "Bengaluru", kind: "bus stop" },
  { name: "HSR Layout 14th Main", area: "Bengaluru", kind: "bus stop" },
  { name: "Bellandur Central Mall", area: "Bengaluru", kind: "bus stop" },
  { name: "Devarabeesanahalli (Ecospace)", area: "Bengaluru", kind: "bus stop" },
  { name: "Kadubeesanahalli", area: "Bengaluru", kind: "bus stop" },
  { name: "KR Puram Railway Station", area: "Bengaluru", kind: "bus stop" },
  { name: "Tin Factory Junction", area: "Bengaluru", kind: "bus stop" },
  { name: "Electronic City Tollgate", area: "Bengaluru", kind: "bus stop" },
  { name: "Hebbal Flyover", area: "Bengaluru", kind: "bus stop" },
  { name: "Kempegowda Intl Airport (Terminal 1)", area: "Bengaluru", kind: "bus stop" },
  { name: "Jayanagar 4th Block", area: "Bengaluru", kind: "bus stop" },
  { name: "Banashankari TTMC", area: "Bengaluru", kind: "bus stop" },
  { name: "Dakshina Kannada", area: "Dakshina Kannada", kind: "area reference" },
  { name: "Mangaluru", area: "Dakshina Kannada", kind: "area reference" },
  { name: "Udupi", area: "Udupi", kind: "area reference" },
  { name: "Shivamogga", area: "Shivamogga", kind: "area reference" },
];

const AREA_ALIASES: Record<string, string> = {
  bangalore: "Bengaluru",
  "bangalore urban": "Bengaluru",
  "bengaluru urban": "Bengaluru",
  "dakshina kannada district": "Dakshina Kannada",
  mangalore: "Dakshina Kannada",
  shimoga: "Shivamogga",
};

function normalizeLocation(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function getServiceArea(location: string): string | null {
  const query = normalizeLocation(location);
  if (!query) return null;

  const aliasArea = AREA_ALIASES[query];
  if (aliasArea) return aliasArea;

  const match = SERVICE_LOCATIONS.find((entry) => {
    const name = normalizeLocation(entry.name);
    return name === query || name.startsWith(`${query} `);
  });
  return match?.area ?? null;
}

export function isServiceAreaLocation(location: string): boolean {
  return getServiceArea(location) !== null;
}
