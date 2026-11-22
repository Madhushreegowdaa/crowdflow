
-- ============================================================================
-- CROWDFLOW PHASE 2: SECURITY HARDENING MIGRATION
-- Target: Supabase PostgreSQL
-- File: 20261122000000_security_and_rls_hardening.sql
--
-- IMPORTANT:
-- 1. Review before execution.
-- 2. Run only after verifying application authentication and admin operations.
-- 3. Existing handle_new_auth_user() is intentionally preserved.
-- 4. service_role and postgres table privileges are preserved.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. PASS REQUESTS
-- ============================================================================
-- Passengers:
--   SELECT their own requests.
--   INSERT their own pending requests.
--
-- Admins:
--   SELECT all requests.
--   UPDATE requests (approval/rejection).
--
-- No passenger UPDATE or DELETE access.

ALTER TABLE public.pass_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
    "Passenger own pass_requests"
ON public.pass_requests;

DROP POLICY IF EXISTS
    "Passengers submit own pass requests"
ON public.pass_requests;

CREATE POLICY "Passengers submit own pass requests"
ON public.pass_requests
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
);

CREATE POLICY "Passenger own pass_requests"
ON public.pass_requests
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS
    "Admins can view all pass requests"
ON public.pass_requests;

CREATE POLICY "Admins can view all pass requests"
ON public.pass_requests
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS
    "Admins can update pass requests"
ON public.pass_requests;

CREATE POLICY "Admins can update pass requests"
ON public.pass_requests
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- Prevent changing request ownership, identity and submitted details.
-- Permit only pending -> pending/approved/rejected.
-- Approved and rejected requests are final.

CREATE OR REPLACE FUNCTION public.prevent_pass_request_tampering()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.pass_type IS DISTINCT FROM OLD.pass_type
       OR NEW.route_category IS DISTINCT FROM OLD.route_category
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
        RAISE EXCEPTION
            'Pass request identity and submitted details cannot be modified.';
    END IF;

    IF OLD.status IN ('approved', 'rejected')
       AND NEW.status IS DISTINCT FROM OLD.status
    THEN
        RAISE EXCEPTION
            'Approved or rejected pass requests cannot change status.';
    END IF;

    IF OLD.status = 'pending'
       AND NEW.status NOT IN ('pending', 'approved', 'rejected')
    THEN
        RAISE EXCEPTION
            'Invalid pass request status transition.';
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS
    trg_prevent_pass_request_tampering
ON public.pass_requests;

CREATE TRIGGER trg_prevent_pass_request_tampering
BEFORE UPDATE ON public.pass_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_pass_request_tampering();


-- ============================================================================
-- 2. DIGITAL PASSES
-- ============================================================================
-- Passengers retain their existing own-pass SELECT policies.
-- Admins can view all passes, issue new passes and update existing passes.
-- Pass ownership cannot be changed.

DROP POLICY IF EXISTS
    "Admins can view all digital passes"
ON public.digital_passes;

CREATE POLICY "Admins can view all digital passes"
ON public.digital_passes
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS
    "Admins can insert digital passes"
ON public.digital_passes;

CREATE POLICY "Admins can insert digital passes"
ON public.digital_passes
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS
    "Admins can update digital passes"
ON public.digital_passes;

CREATE POLICY "Admins can update digital passes"
ON public.digital_passes
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE OR REPLACE FUNCTION public.prevent_digital_pass_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION
            'Digital pass ownership cannot be changed.';
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS
    trg_prevent_digital_pass_user_id_change
ON public.digital_passes;

CREATE TRIGGER trg_prevent_digital_pass_user_id_change
BEFORE UPDATE ON public.digital_passes
FOR EACH ROW
EXECUTE FUNCTION public.prevent_digital_pass_user_id_change();


-- ============================================================================
-- 3. PROFILES
-- ============================================================================
-- Preserve passenger own-profile SELECT and UPDATE policies.
-- Add admin ability to view profiles.

DROP POLICY IF EXISTS
    "Admins can view all profiles"
ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ============================================================================
-- 4. ALERTS
-- ============================================================================
-- Public SELECT remains available.
-- Only admins can INSERT and UPDATE alerts.

DROP POLICY IF EXISTS
    "Allow alert creation"
ON public.alerts;

DROP POLICY IF EXISTS
    "Allow alert updates"
ON public.alerts;

DROP POLICY IF EXISTS
    "Admins can create alerts"
ON public.alerts;

CREATE POLICY "Admins can create alerts"
ON public.alerts
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS
    "Admins can update alerts"
ON public.alerts;

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);


-- ============================================================================
-- 5. DEPLOYMENT RECOMMENDATIONS
-- ============================================================================
-- Public SELECT remains available.
-- Only admins can INSERT and UPDATE recommendations.

DROP POLICY IF EXISTS
    "Allow deployment recommendation creation"
ON public.deployment_recommendations;

DROP POLICY IF EXISTS
    "Allow deployment recommendation updates"
ON public.deployment_recommendations;

DROP POLICY IF EXISTS
    "Admins can create deployment recommendations"
ON public.deployment_recommendations;

CREATE POLICY "Admins can create deployment recommendations"
ON public.deployment_recommendations
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

DROP POLICY IF EXISTS
    "Admins can update deployment recommendations"
ON public.deployment_recommendations;

CREATE POLICY "Admins can update deployment recommendations"
ON public.deployment_recommendations
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Only one pending recommendation per exact route_name.
-- Existing duplicate check returned no rows.

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_deployment_pending_route
ON public.deployment_recommendations (route_name)
WHERE status = 'pending';


-- ============================================================================
-- 6. TABLE PRIVILEGES
-- ============================================================================
-- Remove excessive table privileges from anon and authenticated.
-- Re-grant only the required operations.
--
-- This also removes direct TRUNCATE, REFERENCES and TRIGGER privileges.
-- postgres and service_role are deliberately excluded.

REVOKE ALL PRIVILEGES ON TABLE
    public.alerts,
    public.buses,
    public.crowd_logs,
    public.deployment_recommendations,
    public.digital_passes,
    public.pass_requests,
    public.profiles,
    public.routes,
    public.stops
FROM anon, authenticated;


-- 6A. Public transport information: read only.

GRANT SELECT ON TABLE
    public.buses,
    public.crowd_logs,
    public.routes,
    public.stops
TO anon, authenticated;


-- 6B. Alerts: public reading, authenticated admin writing.
-- RLS restricts INSERT and UPDATE to admins.

GRANT SELECT ON TABLE public.alerts
TO anon, authenticated;

GRANT INSERT, UPDATE ON TABLE public.alerts
TO authenticated;


-- 6C. Deployment recommendations: public reading.
-- RLS restricts INSERT and UPDATE to admins.

GRANT SELECT ON TABLE public.deployment_recommendations
TO anon, authenticated;

GRANT INSERT, UPDATE ON TABLE public.deployment_recommendations
TO authenticated;


-- 6D. Pass requests:
-- Authenticated passengers can SELECT and INSERT.
-- UPDATE is granted at table level for admin operations.
-- RLS restricts UPDATE to admins.

GRANT SELECT, INSERT, UPDATE ON TABLE public.pass_requests
TO authenticated;


-- 6E. Digital passes:
-- Authenticated passengers can SELECT their own passes.
-- Admins can INSERT and UPDATE through RLS.

GRANT SELECT, INSERT, UPDATE ON TABLE public.digital_passes
TO authenticated;


-- 6F. Profiles:
-- Preserve passenger SELECT and own-profile UPDATE.
-- Admin SELECT is controlled by RLS.

GRANT SELECT, UPDATE ON TABLE public.profiles
TO authenticated;


-- ============================================================================
-- 7. DEFAULT PRIVILEGES
-- ============================================================================
-- These changes apply to future objects created by postgres in public.
-- Existing objects are handled separately above.
-- Supabase-managed supabase_admin defaults are intentionally untouched.

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES
FOR ROLE postgres
IN SCHEMA public
REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- 8. TRIGGER FUNCTION EXECUTION PRIVILEGES
-- ============================================================================
-- Prevent direct RPC execution of internal trigger functions.
-- The triggers themselves remain installed.

REVOKE ALL ON FUNCTION
    public.prevent_pass_request_tampering()
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
    public.prevent_digital_pass_user_id_change()
FROM PUBLIC, anon, authenticated;


-- ============================================================================
-- 9. REALTIME
-- ============================================================================
-- Preserve buses, digital_passes and pass_requests.
-- Add alerts only if it is not already published.

DO $publication$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime
        ADD TABLE public.alerts;
    END IF;
END;
$publication$;


-- ============================================================================
-- 10. COMPLETE
-- ============================================================================
-- Transaction commits all changes together.
-- Any SQL error before COMMIT should abort the transaction.

COMMIT;
