-- Travel Wallet tables

-- Identity verification (mock only — no Aadhaar images or full numbers stored)
CREATE TABLE IF NOT EXISTS public.wallet_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'not_verified'
    CHECK (verification_status IN ('not_verified', 'pending', 'verified')),
  masked_reference TEXT,          -- e.g. "XXXX-XXXX-1234" — never full number
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Travel documents metadata (no file content stored in DB)
CREATE TABLE IF NOT EXISTS public.travel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL CHECK (char_length(document_name) BETWEEN 1 AND 120),
  category TEXT NOT NULL CHECK (category IN ('student_id', 'concession_proof', 'other')),
  file_path TEXT NOT NULL,        -- Supabase Storage path (private bucket)
  file_size_bytes INTEGER,
  mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'under_review', 'accepted', 'rejected')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.wallet_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_documents ENABLE ROW LEVEL SECURITY;

-- Passengers: own rows only
CREATE POLICY "Passenger own verification" ON public.wallet_verifications
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Passenger own documents" ON public.travel_documents
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_verifications_user ON public.wallet_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_documents_user ON public.travel_documents(user_id);
