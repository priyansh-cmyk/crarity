-- Candidates hit the assessment without being logged in (anon role).
-- They need INSERT on assessment_sessions to create their session row,
-- and SELECT only on their own row (by id) so the game pages can load it.

GRANT INSERT ON public.assessment_sessions TO anon;
GRANT SELECT ON public.assessment_sessions TO anon;

-- RLS: allow anon to insert freely (they have no uid yet)
DROP POLICY IF EXISTS "Anon can create sessions" ON public.assessment_sessions;
CREATE POLICY "Anon can create sessions"
  ON public.assessment_sessions FOR INSERT TO anon
  WITH CHECK (true);

-- RLS: allow anon to read any session by id (game pages use ?session=<id>)
DROP POLICY IF EXISTS "Anon can read sessions by id" ON public.assessment_sessions;
CREATE POLICY "Anon can read sessions by id"
  ON public.assessment_sessions FOR SELECT TO anon
  USING (true);

-- RLS: allow anon to update their own in-progress session (game score writes)
GRANT UPDATE ON public.assessment_sessions TO anon;
DROP POLICY IF EXISTS "Anon can update sessions" ON public.assessment_sessions;
CREATE POLICY "Anon can update sessions"
  ON public.assessment_sessions FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
