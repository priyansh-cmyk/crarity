-- Monitoring & state recovery infrastructure
-- Adapted from spec to match real schema (no candidate_id, submitted_at, ai_scores, user_roles)

-- 1. last_activity_at on assessment_sessions (for abandonment detection)
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.assessment_sessions
  SET last_activity_at = COALESCE(updated_at, created_at)
  WHERE last_activity_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_activity
  ON public.assessment_sessions(last_activity_at DESC);

-- Trigger: auto-set last_activity_at on every update
CREATE OR REPLACE FUNCTION public.update_assessment_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_activity_trigger ON public.assessment_sessions;
CREATE TRIGGER assessment_activity_trigger
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_assessment_activity();

-- 2. Extend the public view to expose admin_approved + last_activity_at (not PII)
DROP VIEW IF EXISTS public.assessment_sessions_public;
CREATE VIEW public.assessment_sessions_public
WITH (security_invoker = true)
AS SELECT
  id, current_step, scores, total_score, completed, status,
  role_type, role_id, city, created_at, updated_at,
  last_activity_at, admin_approved
FROM public.assessment_sessions;

GRANT SELECT ON public.assessment_sessions_public TO anon, authenticated;

-- 3. Error logs table (anon can INSERT so client-side ErrorBoundary can log)
CREATE TABLE IF NOT EXISTS public.error_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_created
  ON public.error_logs(created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon candidates) can write errors — no user data stored in this table
DROP POLICY IF EXISTS "Anyone can log errors" ON public.error_logs;
CREATE POLICY "Anyone can log errors"
  ON public.error_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Only admin can read
DROP POLICY IF EXISTS "Admin reads error logs" ON public.error_logs;
CREATE POLICY "Admin reads error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');

GRANT INSERT ON public.error_logs TO anon;
GRANT INSERT, SELECT ON public.error_logs TO authenticated;
