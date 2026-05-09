
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS comfortable_with_office boolean,
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload a resume (candidates are anonymous during assessment)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'resumes');

-- Employers can view resumes for sessions on their roles; admins can view all
CREATE POLICY "Employers and admins can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.assessment_sessions s
      JOIN public.roles r ON r.id = s.role_id
      WHERE s.resume_url LIKE '%' || storage.objects.name
        AND r.user_id = auth.uid()
    )
  )
);
