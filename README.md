# CrowdFlow

CrowdFlow is a Next.js passenger interface backed by the team's shared Supabase project.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the shared project's API URL and publishable key.
3. In the Supabase Dashboard for the shared project, open **SQL Editor** and run `supabase/schema.sql` once. It creates the `buses`, `stops`, and `crowd_logs` tables, enables read-only public access and Realtime for buses, and seeds the shared demo fleet.
4. Install the AI API dependencies with `python -m pip install -r ai-engine/requirements.txt`.
5. Start the full app with `npm run dev`. This installs the Express backend dependencies if needed, then starts Next.js at `http://localhost:3000`, the FastAPI AI API on port 8000, and the Express/Supabase admin API on port 5000.

Run either `supabase/schema.sql` in the SQL Editor or apply the migration with the Supabase CLI; do not run both as separate bootstrap scripts.

The browser app can read shared fleet data, but public client writes are intentionally disabled. The tracking animation is a local demonstration and does not persist simulated GPS values.

CrowdFlow is scoped to Bengaluru, Dakshina Kannada, Udupi, and Shivamogga. Fleet cards, route search, stop suggestions, and popular corridors exclude out-of-scope regions. Intercity sample routes are retained only when they connect two of the selected areas; their intermediate places do not represent verified pickup stops.

The source and destination autocomplete shows every case-insensitive match from the currently loaded fleet's route stops and the selected areas' local reference list, sorted alphabetically. Bengaluru has a bundled stop list; the other areas currently have only city/district reference points in the bundled data. Those area references are labeled in the picker and are not bus terminals. The directory is not an exhaustive list of stops.

Shared database routes remain the source for listed fleet buses. Bundled intercity routes are illustrative only and are shown separately from database buses; their operators, terminals, schedules, fares, live locations, and crowd readings are not verified. No official terminal or timetable feed for Dakshina Kannada, Udupi, or Shivamogga is currently imported. Google Maps transit directions are available only for searches whose endpoints are within the selected service areas, and are not verified CrowdFlow bus schedules.

When no direct shared-database bus matches, CrowdFlow can show buses serving only the pickup or destination in separate groups; those are not direct-trip recommendations. A complete stop directory or all available bus schedules requires an authoritative or community-mapped data feed; incomplete or unverified records must not be presented as live service.
