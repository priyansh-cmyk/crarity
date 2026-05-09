-- Remove the broad anon SELECT on the base table (PII would leak)
DROP POLICY IF EXISTS "Anon can read sessions (PII filtered via view)" ON public.assessment_sessions;

-- Recreate the view as SECURITY DEFINER so anon can read non-PII columns
-- without needing a SELECT policy on the base table.
DROP VIEW IF EXISTS public.assessment_sessions_public;

CREATE VIEW public.assessment_sessions_public
WITH (security_invoker = false)
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
  updated_at
FROM public.assessment_sessions;

GRANT SELECT ON public.assessment_sessions_public TO anon, authenticated;