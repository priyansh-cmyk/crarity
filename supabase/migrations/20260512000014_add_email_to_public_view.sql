-- Add email and name to assessment_sessions_public so the results page
-- can show the candidate their own email without requiring login.
-- The session ID (UUID) is private to the candidate so exposing email
-- via this view is acceptable.

-- Recreate view with name + email added (CREATE OR REPLACE can't reorder columns)
DROP VIEW IF EXISTS public.assessment_sessions_public;

CREATE VIEW public.assessment_sessions_public
WITH (security_invoker = true)
AS
SELECT
  id,
  current_step,
  scores,
  total_score,
  completed,
  status,
  role_type,
  role_id,
  city,
  created_at,
  updated_at,
  name,
  email
FROM public.assessment_sessions;

GRANT SELECT ON public.assessment_sessions_public TO anon, authenticated;
