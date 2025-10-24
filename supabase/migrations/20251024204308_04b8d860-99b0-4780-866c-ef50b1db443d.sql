-- Restaurar perfil ADMIN do usuário prof.guilhermeferrari@gmail.com
INSERT INTO public.user_roles (user_id, role, escola_id)
VALUES ('12f4cadb-7348-4615-8808-7806c8c04ae9', 'ADMIN'::app_role, NULL)
ON CONFLICT (user_id, role) DO NOTHING;