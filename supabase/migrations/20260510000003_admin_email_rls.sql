-- Drop all previous admin policies and replace with direct JWT email check.
-- This is the most reliable approach — no function calls, no table lookups.

-- assessment_sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Admins can update all sessions" ON public.assessment_sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.assessment_sessions FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');
CREATE POLICY "Admins can update all sessions"
  ON public.assessment_sessions FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com')
  WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com')
  WITH CHECK (true);

-- roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.roles;
CREATE POLICY "Admins can view all roles"
  ON public.roles FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');
CREATE POLICY "Admins can update all roles"
  ON public.roles FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com')
  WITH CHECK (true);

-- candidate_roles
DROP POLICY IF EXISTS "Admins can view all candidate_roles" ON public.candidate_roles;
CREATE POLICY "Admins can view all candidate_roles"
  ON public.candidate_roles FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');

-- interviews
DROP POLICY IF EXISTS "Admins can view all interviews" ON public.interviews;
DROP POLICY IF EXISTS "Admins can update all interviews" ON public.interviews;
CREATE POLICY "Admins can view all interviews"
  ON public.interviews FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com');
CREATE POLICY "Admins can update all interviews"
  ON public.interviews FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'priyansh@crarity.com')
  WITH CHECK (true);
