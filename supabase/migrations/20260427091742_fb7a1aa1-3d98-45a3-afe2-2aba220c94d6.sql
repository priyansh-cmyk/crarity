DROP POLICY IF EXISTS "Anon can update in-progress sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Employers can update sessions for their roles" ON public.assessment_sessions;

CREATE POLICY "Anon can update in-progress sessions"
ON public.assessment_sessions
FOR UPDATE
TO anon
USING (completed = false)
WITH CHECK (completed = false);

CREATE POLICY "Employers can update sessions for their roles"
ON public.assessment_sessions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (role_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.roles r WHERE r.id = assessment_sessions.role_id AND r.user_id = auth.uid()
     ))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (role_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.roles r WHERE r.id = assessment_sessions.role_id AND r.user_id = auth.uid()
     ))
);