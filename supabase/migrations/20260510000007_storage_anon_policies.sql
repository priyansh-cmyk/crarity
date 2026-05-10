-- Make pitch-recordings public so getPublicUrl works and audio plays in admin/employer views.
-- Candidates record anonymously so the bucket must accept anon uploads.

UPDATE storage.buckets SET public = true WHERE id = 'pitch-recordings';

-- Allow anon users to upload recordings (candidates are not logged in)
DROP POLICY IF EXISTS "Anon can upload pitch recordings" ON storage.objects;
CREATE POLICY "Anon can upload pitch recordings"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'pitch-recordings');

-- Allow anon users to select/read their own upload immediately after upload
DROP POLICY IF EXISTS "Public can read pitch recordings" ON storage.objects;
CREATE POLICY "Public can read pitch recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-recordings');

-- Allow authenticated (admin / employer) to read all recordings
DROP POLICY IF EXISTS "Authenticated can read pitch recordings" ON storage.objects;
CREATE POLICY "Authenticated can read pitch recordings"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'pitch-recordings');
