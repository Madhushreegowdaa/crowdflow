-- Record crowd-log provenance and align stored bus labels with the occupancy thresholds.
-- Review and apply explicitly; this migration has not been run.

BEGIN;

ALTER TABLE public.crowd_logs
  ADD COLUMN IF NOT EXISTS source TEXT;

-- These are the 20 verified seeded demo readings currently in this project.
-- Keep every other pre-existing row explicitly unknown.
UPDATE public.crowd_logs
SET source = CASE
  WHEN bus_id IN ('bus-335e-1', 'bus-500d-1', 'bus-k3-alt', 'bus-kia8-1')
    AND recorded_at IN (
      TIMESTAMPTZ '2026-11-22 17:58:24.74806+00',
      TIMESTAMPTZ '2026-11-22 18:03:24.74806+00',
      TIMESTAMPTZ '2026-11-22 18:08:24.74806+00',
      TIMESTAMPTZ '2026-11-22 18:13:24.74806+00',
      TIMESTAMPTZ '2026-11-22 18:18:24.74806+00'
    )
    THEN 'simulated'
  ELSE 'unknown'
END
WHERE source IS NULL;

-- New records remain nullable, with an explicit fallback until ingestion supplies a source.
ALTER TABLE public.crowd_logs
  ALTER COLUMN source SET DEFAULT 'unknown';

-- Recompute labels only where occupancy is present and valid.
UPDATE public.buses
SET crowd_level = CASE
  WHEN occupancy_percent <= 30 THEN 'low'
  WHEN occupancy_percent <= 60 THEN 'moderate'
  WHEN occupancy_percent <= 85 THEN 'high'
  ELSE 'very high'
END
WHERE occupancy_percent BETWEEN 0 AND 100
  AND crowd_level IS DISTINCT FROM CASE
    WHEN occupancy_percent <= 30 THEN 'low'
    WHEN occupancy_percent <= 60 THEN 'moderate'
    WHEN occupancy_percent <= 85 THEN 'high'
    ELSE 'very high'
  END;

COMMIT;
