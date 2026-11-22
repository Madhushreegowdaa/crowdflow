BEGIN;

ALTER TABLE public.buses
  ALTER COLUMN crowd_level SET DEFAULT 'unavailable',
  ALTER COLUMN occupancy_percent DROP DEFAULT,
  ALTER COLUMN current_passengers DROP DEFAULT;

ALTER TABLE public.buses
  DROP CONSTRAINT IF EXISTS buses_crowd_level_check;

ALTER TABLE public.buses
  ADD CONSTRAINT buses_crowd_level_check
  CHECK (crowd_level IN ('low', 'moderate', 'high', 'very high', 'unavailable'));

COMMIT;
