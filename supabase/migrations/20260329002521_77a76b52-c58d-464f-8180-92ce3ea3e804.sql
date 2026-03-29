-- Seed initial admin role for matholamew (bypasses RLS via migration)
INSERT INTO public.user_roles (user_id, role)
VALUES ('73e08b29-6c4e-46d0-ae9b-5782a535d9fb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;