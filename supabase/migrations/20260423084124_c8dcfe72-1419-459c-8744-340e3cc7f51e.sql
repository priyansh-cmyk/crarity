-- Create assessment_sessions table
CREATE TABLE public.assessment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  current_step TEXT NOT NULL DEFAULT 'game-1',
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create an assessment session (anonymous candidates)
CREATE POLICY "Anyone can create assessment sessions"
ON public.assessment_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can read sessions (needed since the candidate is anonymous and identified by the session uuid in the URL)
CREATE POLICY "Anyone can view assessment sessions"
ON public.assessment_sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can update assessment sessions (anonymous candidates progressing through games)
CREATE POLICY "Anyone can update assessment sessions"
ON public.assessment_sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_assessment_sessions_updated_at
BEFORE UPDATE ON public.assessment_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();