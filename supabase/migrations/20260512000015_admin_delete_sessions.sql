-- Allow admins to delete assessment sessions
CREATE POLICY "Admins can delete sessions"
ON public.assessment_sessions
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
