CREATE TABLE IF NOT EXISTS public.interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  employer_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  interview_type text NOT NULL DEFAULT 'Phone Screen',
  status text NOT NULL DEFAULT 'scheduled',
  google_meet_link text,
  notes text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interviews_status_check CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  CONSTRAINT interviews_type_check CHECK (interview_type IN ('Phone Screen', 'Technical Round', 'Final Round'))
);

CREATE INDEX IF NOT EXISTS idx_interviews_employer ON public.interviews(employer_id);
CREATE INDEX IF NOT EXISTS idx_interviews_session ON public.interviews(session_id);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON public.interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON public.interviews(status);

ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can view their interviews"
  ON public.interviews FOR SELECT TO authenticated
  USING (employer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Employers can create interviews"
  ON public.interviews FOR INSERT TO authenticated
  WITH CHECK (employer_id = auth.uid());

CREATE POLICY "Employers can update their interviews"
  ON public.interviews FOR UPDATE TO authenticated
  USING (employer_id = auth.uid())
  WITH CHECK (employer_id = auth.uid());

CREATE TRIGGER interviews_set_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
