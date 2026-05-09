-- Add role_type column
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS role_type text NOT NULL DEFAULT 'academic_counselor';

-- Add status column for admin review workflow
ALTER TABLE public.assessment_sessions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress';

-- Backfill: mark completed rows
UPDATE public.assessment_sessions
SET status = 'completed'
WHERE completed = true AND status = 'in_progress';

-- Helpful indexes for admin filtering
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_role_type ON public.assessment_sessions(role_type);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_total_score ON public.assessment_sessions(total_score DESC);