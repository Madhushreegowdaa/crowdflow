-- Additive provenance for deployment recommendations.
-- Apply only after review and before deploying server code that writes source.
-- Existing recommendations remain in history and are marked unknown.

BEGIN;

ALTER TABLE public.deployment_recommendations
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'unknown';

-- Keep historical recommendation values intact while allowing resolved rows.
-- Recreate only status CHECK constraints on this table, extending the known
-- pending/approved/rejected states with resolved.
DO $migration$
DECLARE
  status_constraint RECORD;
BEGIN
  FOR status_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.deployment_recommendations'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.deployment_recommendations DROP CONSTRAINT %I',
      status_constraint.conname
    );
  END LOOP;

  ALTER TABLE public.deployment_recommendations
    ADD CONSTRAINT deployment_recommendations_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')) NOT VALID;
END;
$migration$;

UPDATE public.deployment_recommendations
SET source = 'unknown'
WHERE source IS NULL;

COMMENT ON COLUMN public.deployment_recommendations.source IS
  'Origin of the recommendation calculation: database, simulated, or unknown.';

COMMIT;
