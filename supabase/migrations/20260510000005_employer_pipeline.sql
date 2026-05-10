-- 1. Admin approval flag on assessment_sessions
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN NOT NULL DEFAULT FALSE;

GRANT UPDATE (admin_approved) ON public.assessment_sessions TO authenticated;

-- Admin can set admin_approved
DROP POLICY IF EXISTS "Admins can approve sessions" ON public.assessment_sessions;
CREATE POLICY "Admins can approve sessions"
  ON public.assessment_sessions FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com')
  WITH CHECK (true);

-- 2. Per-employer pipeline status table
CREATE TABLE IF NOT EXISTS public.employer_candidate_pipeline (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id   UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'new',  -- new | shortlisted | interview_sent | rejected
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employer_id, session_id)
);

ALTER TABLE public.employer_candidate_pipeline ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.employer_candidate_pipeline TO authenticated;

-- Employers manage only their own pipeline
CREATE POLICY "Employers manage own pipeline"
  ON public.employer_candidate_pipeline FOR ALL TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

-- Admin can see all
CREATE POLICY "Admins view all pipeline"
  ON public.employer_candidate_pipeline FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');
