-- Create candidates table (stores candidate profiles)
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  country TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  work_experience JSONB DEFAULT '[]'::jsonb,
  resume_url TEXT,
  video_intro_url TEXT,
  availability TEXT,
  work_preference TEXT,
  portfolio_url TEXT,
  languages TEXT[] DEFAULT '{}',
  email TEXT NOT NULL,
  phone TEXT
);

-- Create candidate_roles junction table (links candidates to roles they're interested in)
CREATE TABLE public.candidate_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  employer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, role_id)
);

-- Create test_results table (stores candidate test performance)
CREATE TABLE public.test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL DEFAULT 100,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  details JSONB
);

-- Create interview_requests table (tracks interview requests from employers)
CREATE TABLE public.interview_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_role_id UUID NOT NULL REFERENCES public.candidate_roles(id) ON DELETE CASCADE,
  employer_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;

-- Candidates: Employers can view candidates linked to their roles (excluding contact info via query selection)
CREATE POLICY "Employers can view candidates in their roles"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.candidate_roles cr
    JOIN public.roles r ON cr.role_id = r.id
    WHERE cr.candidate_id = candidates.id
    AND r.user_id = auth.uid()
  )
);

-- Candidate_roles: Employers can view/update entries for their roles
CREATE POLICY "Employers can view candidate_roles for their roles"
ON public.candidate_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Employers can update candidate_roles for their roles"
ON public.candidate_roles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Test_results: Employers can view results for candidates in their roles
CREATE POLICY "Employers can view test results for candidates in their roles"
ON public.test_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.candidate_roles cr
    JOIN public.roles r ON cr.role_id = r.id
    WHERE cr.candidate_id = test_results.candidate_id
    AND r.user_id = auth.uid()
  )
);

-- Interview_requests: Employers can create/view their own requests
CREATE POLICY "Employers can view their interview requests"
ON public.interview_requests
FOR SELECT
TO authenticated
USING (employer_id = auth.uid());

CREATE POLICY "Employers can create interview requests"
ON public.interview_requests
FOR INSERT
TO authenticated
WITH CHECK (employer_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_roles_updated_at
BEFORE UPDATE ON public.candidate_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();