ALTER TABLE public.assessment_sessions
ADD CONSTRAINT candidate_status_check
CHECK (candidate_status IN ('looking', 'hired', 'break'));