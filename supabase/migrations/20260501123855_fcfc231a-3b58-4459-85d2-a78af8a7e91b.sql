ALTER TABLE public.assessment_sessions
ADD COLUMN candidate_status text NOT NULL DEFAULT 'looking';

CREATE INDEX idx_assessment_sessions_candidate_status ON public.assessment_sessions(candidate_status);

-- Allow authenticated candidate (linked via updated_by) to view & update their own session
CREATE POLICY "Candidates can view their own session"
ON public.assessment_sessions
FOR SELECT
TO authenticated
USING (updated_by = auth.uid());

CREATE POLICY "Candidates can update their own session"
ON public.assessment_sessions
FOR UPDATE
TO authenticated
USING (updated_by = auth.uid())
WITH CHECK (updated_by = auth.uid());