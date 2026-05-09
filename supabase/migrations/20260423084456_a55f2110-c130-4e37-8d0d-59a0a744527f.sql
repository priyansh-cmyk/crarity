ALTER TABLE public.assessment_sessions
  ADD COLUMN IF NOT EXISTS total_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_sessions_phone ON public.assessment_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.assessment_sessions(created_at DESC);