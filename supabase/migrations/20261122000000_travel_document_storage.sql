-- Private storage for passenger travel documents.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'travel-documents',
  'travel-documents',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Passengers read own travel documents" ON storage.objects;
CREATE POLICY "Passengers read own travel documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'travel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Passengers upload own travel documents" ON storage.objects;
CREATE POLICY "Passengers upload own travel documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'travel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Passengers delete own travel documents" ON storage.objects;
CREATE POLICY "Passengers delete own travel documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'travel-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
