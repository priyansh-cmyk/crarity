ALTER TABLE public.interviews
DROP CONSTRAINT IF EXISTS interviews_interview_type_check;

ALTER TABLE public.interviews
ADD CONSTRAINT interviews_interview_type_check
CHECK (interview_type IN ('Initial Screening', 'Final Round'));

ALTER TABLE public.interviews
ALTER COLUMN interview_type SET DEFAULT 'Initial Screening';