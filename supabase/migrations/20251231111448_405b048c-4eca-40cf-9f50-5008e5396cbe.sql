-- Add columns to interview_requests table for Google Meet scheduling
ALTER TABLE public.interview_requests 
ADD COLUMN IF NOT EXISTS meeting_link text,
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS meeting_title text;