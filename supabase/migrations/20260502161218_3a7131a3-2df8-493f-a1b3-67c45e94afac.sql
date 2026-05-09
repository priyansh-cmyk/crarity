ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS willing_to_relocate boolean,
  ADD COLUMN IF NOT EXISTS relocation_timeline text;