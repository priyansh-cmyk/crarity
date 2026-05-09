
ALTER TABLE public.assessment_sessions DROP CONSTRAINT assessment_sessions_source_check;
ALTER TABLE public.assessment_sessions ADD CONSTRAINT assessment_sessions_source_check CHECK (source = ANY (ARRAY['pool'::text, 'imported'::text, 'demo'::text]));
