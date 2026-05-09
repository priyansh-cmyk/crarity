-- 1. DROP LEGACY TABLE
DROP TABLE IF EXISTS public.interview_requests CASCADE;

-- 2. REMOVE EXPERIENCE_LEVEL
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_experience_level_check;
ALTER TABLE public.roles DROP COLUMN IF EXISTS experience_level;

-- 3. FIX ROLE_TYPE CONSTRAINT
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS roles_role_type_check;
UPDATE public.roles SET role_type = 'academic_counselor' WHERE role_type IS NULL OR role_type <> 'academic_counselor';
ALTER TABLE public.roles ADD CONSTRAINT roles_role_type_check CHECK (role_type = 'academic_counselor');
ALTER TABLE public.roles ALTER COLUMN role_type SET DEFAULT 'academic_counselor';

-- 4. FIX INTERVIEW TYPE CONSTRAINT
ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_interview_type_check;
UPDATE public.interviews SET interview_type = 'Initial Screening'
  WHERE interview_type NOT IN ('Initial Screening', 'Final Round');
ALTER TABLE public.interviews ALTER COLUMN interview_type SET DEFAULT 'Initial Screening';
ALTER TABLE public.interviews ADD CONSTRAINT interviews_interview_type_check
  CHECK (interview_type IN ('Initial Screening', 'Final Round'));

-- 5. RECREATE TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_candidates_updated_at ON public.candidates;
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS guard_completed_sessions ON public.assessment_sessions;
CREATE TRIGGER guard_completed_sessions
  BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.assessment_sessions_guard();

-- 6. TIGHTEN ANON RLS
DROP POLICY IF EXISTS "Anon can read non-PII session data" ON public.assessment_sessions;
DROP POLICY IF EXISTS "Anon can update in-progress sessions" ON public.assessment_sessions;
DROP POLICY IF EXISTS "anon_read_all" ON public.assessment_sessions;
DROP POLICY IF EXISTS "anon_update_in_progress" ON public.assessment_sessions;

CREATE POLICY "anon_read_own_session" ON public.assessment_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_update_own_incomplete" ON public.assessment_sessions
  FOR UPDATE TO anon
  USING (completed = false)
  WITH CHECK (completed = false);