-- Add tracking columns
ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'pool',
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz;

ALTER TABLE public.assessment_sessions
  DROP CONSTRAINT IF EXISTS assessment_sessions_source_check;
ALTER TABLE public.assessment_sessions
  ADD CONSTRAINT assessment_sessions_source_check
  CHECK (source IN ('pool', 'imported'));

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_invited_by
  ON public.assessment_sessions(invited_by);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_source
  ON public.assessment_sessions(source);

-- Allow employers to view sessions they imported (in addition to role-based access)
DROP POLICY IF EXISTS "Employers can view sessions they invited" ON public.assessment_sessions;
CREATE POLICY "Employers can view sessions they invited"
  ON public.assessment_sessions
  FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid());

-- Allow employers to create imported sessions tied to themselves
DROP POLICY IF EXISTS "Public can create assessment sessions" ON public.assessment_sessions;
CREATE POLICY "Public can create assessment sessions"
  ON public.assessment_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (completed = false AND status = 'in_progress' AND source = 'pool' AND invited_by IS NULL)
    OR (auth.uid() IS NOT NULL AND source = 'imported' AND invited_by = auth.uid())
  );

-- Update guard trigger to preserve invited_by/source/invitation_sent_at on completed rows
CREATE OR REPLACE FUNCTION public.assessment_sessions_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.completed = true THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Cannot modify a completed assessment session';
    END IF;
    NEW.scores := OLD.scores;
    NEW.total_score := OLD.total_score;
    NEW.completed := OLD.completed;
    NEW.role_id := OLD.role_id;
    NEW.email := OLD.email;
    NEW.phone := OLD.phone;
    NEW.name := OLD.name;
    NEW.city := OLD.city;
    NEW.role_type := OLD.role_type;
    NEW.created_at := OLD.created_at;
    NEW.source := OLD.source;
    NEW.invited_by := OLD.invited_by;
    NEW.invitation_sent_at := COALESCE(NEW.invitation_sent_at, OLD.invitation_sent_at);
  ELSE
    NEW.role_id := COALESCE(OLD.role_id, NEW.role_id);
    NEW.role_type := OLD.role_type;
    NEW.created_at := OLD.created_at;
    NEW.source := OLD.source;
    NEW.invited_by := OLD.invited_by;
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$function$;
