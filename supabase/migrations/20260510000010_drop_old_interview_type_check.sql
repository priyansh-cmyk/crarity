-- The original interviews_type_check constraint allowed ('Phone Screen', 'Technical Round', 'Final Round').
-- A later migration added interviews_interview_type_check with ('Initial Screening', 'Final Round')
-- but never dropped the old one. Both constraints must pass, so 'Initial Screening' was being
-- rejected. Drop the stale original constraint.

ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS interviews_type_check;
