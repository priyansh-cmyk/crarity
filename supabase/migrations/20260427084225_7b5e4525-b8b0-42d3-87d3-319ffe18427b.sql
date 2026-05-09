-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pitch-recordings',
  'pitch-recordings',
  false,
  10485760,
  ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone (including unauthenticated candidates) can upload pitch recordings
CREATE POLICY "Anyone can upload pitch recordings"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'pitch-recordings');

-- Employers can read recordings whose session is linked to one of their roles.
-- File path begins with "{session_id}_..." — split on "_" to recover the session id.
CREATE POLICY "Employers can read recordings for their roles"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pitch-recordings'
    AND EXISTS (
      SELECT 1
      FROM public.assessment_sessions s
      JOIN public.roles r ON r.id = s.role_id
      WHERE r.user_id = auth.uid()
        AND s.id::text = split_part(storage.objects.name, '_', 1)
    )
  );