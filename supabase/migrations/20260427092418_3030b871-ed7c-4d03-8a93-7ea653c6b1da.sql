ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS telemetry jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Allow anon to read/write the new column (mirrors existing column-level grants for anon)
GRANT SELECT (telemetry), UPDATE (telemetry) ON public.assessment_sessions TO anon, authenticated;