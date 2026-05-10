INSERT INTO public.user_roles (user_id, role)
VALUES ('faa9e519-3d62-40ee-a0f3-774d07e39d61', 'admin'::public.app_role)
ON CONFLICT (user_id, role) DO NOTHING;
