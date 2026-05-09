-- Recreate view with security_invoker (no ERROR)
DROP VIEW IF EXISTS public.assessment_sessions_public;
CREATE VIEW public.assessment_sessions_public
WITH (security_invoker = true)
AS
SELECT
  id, current_step, scores, total_score, completed, status,
  role_type, role_id, city, created_at, updated_at
FROM public.assessment_sessions;
GRANT SELECT ON public.assessment_sessions_public TO anon, authenticated;

-- Re-add anon SELECT on base table (needed so the security-invoker view works for anon),
-- but revoke column-level access to PII columns from anon.
CREATE POLICY "Anon can read non-PII session data"
ON public.assessment_sessions
FOR SELECT
TO anon
USING (true);

REVOKE SELECT ON public.assessment_sessions FROM anon;
GRANT SELECT (
  id, current_step, scores, total_score, completed, status,
  role_type, role_id, city, created_at, updated_at, updated_by
) ON public.assessment_sessions TO anon;