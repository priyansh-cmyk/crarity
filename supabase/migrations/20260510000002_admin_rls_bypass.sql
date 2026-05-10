-- Admin bypass policies for all tables used by the admin dashboard.
-- Admins are identified by the has_role() security-definer function
-- which reads from user_roles (bypasses RLS).

-- assessment_sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.assessment_sessions;
CREATE POLICY "Admins can view all sessions"
  ON public.assessment_sessions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all sessions" ON public.assessment_sessions;
CREATE POLICY "Admins can update all sessions"
  ON public.assessment_sessions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.roles;
CREATE POLICY "Admins can view all roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all roles" ON public.roles;
CREATE POLICY "Admins can update all roles"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- candidate_roles
DROP POLICY IF EXISTS "Admins can view all candidate_roles" ON public.candidate_roles;
CREATE POLICY "Admins can view all candidate_roles"
  ON public.candidate_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- interviews
DROP POLICY IF EXISTS "Admins can view all interviews" ON public.interviews;
CREATE POLICY "Admins can view all interviews"
  ON public.interviews FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all interviews" ON public.interviews;
CREATE POLICY "Admins can update all interviews"
  ON public.interviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);
