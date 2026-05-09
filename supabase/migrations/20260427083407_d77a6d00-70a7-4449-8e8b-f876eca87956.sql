ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS role_id uuid NULL REFERENCES public.roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_role_id
  ON public.assessment_sessions(role_id);