-- Employers were unable to see admin-approved candidate pool sessions because
-- the existing SELECT RLS policy on assessment_sessions only covered sessions
-- tied to the employer's own roles or invited_by. Add a policy that lets any
-- authenticated employer SELECT sessions where admin_approved = true.

DROP POLICY IF EXISTS "Employers can view approved pool sessions" ON public.assessment_sessions;
CREATE POLICY "Employers can view approved pool sessions"
  ON public.assessment_sessions FOR SELECT TO authenticated
  USING (admin_approved = true AND completed = true);
