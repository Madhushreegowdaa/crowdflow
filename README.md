# CrowdFlow

CrowdFlow is a Next.js passenger interface backed by the team's shared Supabase project.

## Run locally

1. Install the Next.js dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the shared project's API URL and publishable key.
3. Install the Express dependencies with `npm --prefix server install`. Copy `server/.env.example` to `server/.env` and set its Supabase URL/key and PostgreSQL connection string. PostgreSQL TLS certificate verification is enabled; use a valid certificate chain rather than disabling verification.
4. Create an AI-engine virtual environment and install its dependencies with `python -m pip install -r ai-engine/requirements.txt`. The dev launcher uses `ai-engine/.venv` when present.
5. In the Supabase Dashboard for the shared project, open **SQL Editor** and run `supabase/schema.sql` once. It creates the `buses`, `stops`, and `crowd_logs` tables, enables read-only public access and Realtime for buses, and seeds the shared demo fleet.
6. Start the app with `npm run dev`. It starts Next.js at `http://localhost:3000`, FastAPI on port 8000, and Express on port 5000; it does not install the separate server or Python dependencies.

Run either `supabase/schema.sql` in the SQL Editor or apply the migration with the Supabase CLI; do not run both as separate bootstrap scripts.

The browser app can read shared fleet data, but public client writes are intentionally disabled. The tracking map advances a local simulated GPS position and does not persist it. Production bus loading does not substitute bundled values when Supabase is unavailable or empty; the UI shows an unavailable state. To explicitly enable the bundled demonstration fleet for a local demo, set `NEXT_PUBLIC_CROWDFLOW_DEMO_MODE=true`. The app labels that fleet as simulated. Leave the variable unset or `false` in production.

Admin deployment recommendations are calculated from current `buses.current_passengers` and `buses.total_capacity` when an administrator runs generation. Pending recommendations are updated while a route remains above threshold and marked `resolved` in place when valid occupancy falls below threshold; older rows remain in history. Generated recommendations are labeled as database-derived. Historical recommendations remain `unknown` until their origin is established.

Passenger alternative recommendations use the Express route, which reads current bus records and calls the FastAPI recommender. Recommendations are rule-based and use recorded route stops, crowd level, and ETA; they are not learned predictions. The API requires a boarding stop from the passenger's search or the selected bus route and excludes the bus being replaced.

Admin crowd forecasts require at least three sufficiently recent `crowd_logs` samples for a bus. Browser GPS playback and bundled demo fleet values are not telemetry sources and must not be copied into history. No live sensor or passenger-counter feed is currently configured.

When an authorized operator has a verified passenger-counter export, the server provides a guarded JSONL batch importer. Each nonblank line must contain only `bus_id`, a measured integer `passenger_count`, and the observation's timezone-qualified ISO 8601 `recorded_at`; batches are limited to 1,000 observations. First run a dry check, then explicitly confirm measured data before import:

```powershell
node server/scripts/ingest-crowd-logs.js --input .\verified-export.jsonl --source "verified-provider-or-device" --confirm-real-measurements --dry-run
node server/scripts/ingest-crowd-logs.js --input .\verified-export.jsonl --source "verified-provider-or-device" --confirm-real-measurements
```

The importer validates bus IDs and capacities against `public.buses`, derives occupancy and crowd level from the supplied count, rejects unsupported fields, future or duplicate-in-batch timestamps, and counts above capacity, and commits the batch transactionally. It serializes its duplicate checks against other table writers because the existing schema has no unique key for a bus/timestamp sample. It also requires an explicit operator acknowledgment that the measurements are real. It cannot independently detect whether a numerically valid count is simulated, so do not import test/demo exports. Re-running an identical sample is idempotent; a conflicting existing count aborts the batch. It uses `DATABASE_URL` with PostgreSQL TLS certificate verification enabled. Use a trusted PostgreSQL role already allowed to read `public.buses` and `public.crowd_logs` and insert into `public.crowd_logs`; the script does not use a Supabase publishable or service-role key. The source label is printed in the import report but is not stored because `crowd_logs` has no provenance column; the database therefore cannot independently distinguish imported measurements from any other pre-existing rows. Keep original source exports and operator records according to the team's data-retention policy.

Until an authorized, trustworthy feed is available and verified samples have been imported, history-based forecasts remain unavailable rather than being replaced with simulated predictions. UI labels distinguish database records, historical stored logs, and local simulated GPS playback; database-origin records are not automatically proof of live sensor data.

CrowdFlow is scoped to Bengaluru, Dakshina Kannada, Udupi, and Shivamogga. Fleet cards, route search, stop suggestions, and popular corridors exclude out-of-scope regions. Intercity sample routes are retained only when they connect two of the selected areas; their intermediate places do not represent verified pickup stops.

The source and destination autocomplete shows every case-insensitive match from the currently loaded fleet's route stops and the selected areas' local reference list, sorted alphabetically. Bengaluru has a bundled stop list; the other areas currently have only city/district reference points in the bundled data. Those area references are labeled in the picker and are not bus terminals. The directory is not an exhaustive list of stops.

Shared database routes remain the source for listed fleet buses. Bundled intercity routes are illustrative only and are shown separately from database buses; their operators, terminals, schedules, fares, live locations, and crowd readings are not verified. No official terminal or timetable feed for Dakshina Kannada, Udupi, or Shivamogga is currently imported. Google Maps transit directions are available only for searches whose endpoints are within the selected service areas, and are not verified CrowdFlow bus schedules.

When no direct shared-database bus matches, CrowdFlow can show buses serving only the pickup or destination in separate groups; those are not direct-trip recommendations. A complete stop directory or all available bus schedules requires an authoritative or community-mapped data feed; incomplete or unverified records must not be presented as live service.
