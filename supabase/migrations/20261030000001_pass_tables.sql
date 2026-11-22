-- ============================================================================
-- CrowdFlow: Pass Requests + Digital Passes tables
-- Run this once in the Supabase SQL Editor
-- ============================================================================

-- Pass requests (submitted by passengers, reviewed by admin)
CREATE TABLE IF NOT EXISTS public.pass_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL,
  route_category TEXT NOT NULL CHECK (char_length(route_category) BETWEEN 1 AND 120),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital passes (created by admin on approval)
CREATE TABLE IF NOT EXISTS public.digital_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pass_type TEXT NOT NULL,
  route_category TEXT,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'pending')),
  issued_at DATE NOT NULL
);

-- RLS
ALTER TABLE public.pass_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_passes ENABLE ROW LEVEL SECURITY;

-- Passengers: read + insert their own pass_requests
DROP POLICY IF EXISTS "Passenger own pass_requests" ON public.pass_requests;
CREATE POLICY "Passenger own pass_requests" ON public.pass_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Passengers: read their own digital_passes
DROP POLICY IF EXISTS "Passenger own digital_passes" ON public.digital_passes;
CREATE POLICY "Passenger own digital_passes" ON public.digital_passes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Service role (used by admin API) can insert digital_passes
-- The service role bypasses RLS by default — no extra policy needed.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pass_requests_user ON public.pass_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pass_requests_status ON public.pass_requests(status);
CREATE INDEX IF NOT EXISTS idx_digital_passes_user ON public.digital_passes(user_id);

-- Realtime for live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pass_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pass_requests;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'digital_passes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_passes;
  END IF;
END
$$;
