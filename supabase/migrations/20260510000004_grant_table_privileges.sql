-- Grant table-level privileges to authenticated role.
-- "permission denied for table X" fires BEFORE RLS — this is the root cause
-- of admin dashboard being empty. Policies are irrelevant until grants pass.

GRANT SELECT, INSERT, UPDATE ON public.assessment_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.candidate_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.interviews TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
