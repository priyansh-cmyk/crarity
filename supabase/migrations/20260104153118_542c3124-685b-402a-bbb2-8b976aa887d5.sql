-- Allow employers to create candidates for their roles
CREATE POLICY "Employers can create candidates for their roles"
ON candidates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles 
    WHERE roles.user_id = auth.uid()
  )
);

-- Allow employers to insert candidate_roles for their roles
CREATE POLICY "Employers can add candidates to their roles"
ON candidate_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles 
    WHERE roles.id = candidate_roles.role_id 
    AND roles.user_id = auth.uid()
  )
);