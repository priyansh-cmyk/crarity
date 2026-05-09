-- Create roles table for storing employer-created roles
CREATE TABLE public.roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role_type TEXT NOT NULL CHECK (role_type IN ('ta_intern', 'bd_intern', 'creative_strategist', 'video_editor')),
    experience_level TEXT NOT NULL CHECK (experience_level IN ('student', 'fresher')),
    is_custom BOOLEAN NOT NULL DEFAULT false,
    custom_requirements JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own roles" 
ON public.roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roles" 
ON public.roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles" 
ON public.roles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roles" 
ON public.roles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();