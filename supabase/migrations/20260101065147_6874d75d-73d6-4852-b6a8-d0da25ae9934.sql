-- Add new columns to profiles for Request Access form data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS referral text,
ADD COLUMN IF NOT EXISTS hiring_roles text,
ADD COLUMN IF NOT EXISTS actively_hiring text;