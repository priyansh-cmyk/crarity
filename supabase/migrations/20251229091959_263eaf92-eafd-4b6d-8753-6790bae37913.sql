-- Add additional profile fields for settings page
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS team_size text;