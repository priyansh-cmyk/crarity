-- Enable Supabase Realtime on assessment_sessions so the candidate
-- dashboard can subscribe to live updates (admin_approved, total_score, scores)
-- without polling.

DO $$
BEGIN
  -- Only add if not already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'assessment_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assessment_sessions;
  END IF;
END $$;
