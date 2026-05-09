
-- Drop student_applications first (references student_profiles)
DROP TABLE IF EXISTS public.student_applications CASCADE;

-- Drop student_profiles
DROP TABLE IF EXISTS public.student_profiles CASCADE;

-- Drop the student_status enum
DROP TYPE IF EXISTS public.student_status CASCADE;
