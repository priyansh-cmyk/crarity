ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS prior_experience boolean,
  ADD COLUMN IF NOT EXISTS prior_experience_duration text,
  ADD COLUMN IF NOT EXISTS weekend_availability boolean,
  ADD COLUMN IF NOT EXISTS start_timeline text;