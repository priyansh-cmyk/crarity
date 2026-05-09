-- Add CHECK constraint to enforce valid status values on candidate_roles table
ALTER TABLE public.candidate_roles
ADD CONSTRAINT valid_status CHECK (
  status IN ('New', 'Reviewing', 'Shortlisted', 'Interview Requested', 'Rejected')
);