-- Sincronizar usuários antigos do auth.users para public.usuarios
-- Inserir usuários que existem em auth.users mas não em public.usuarios
INSERT INTO public.usuarios (id, nome, email, ativo, escola_id)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'nome', split_part(au.email, '@', 1)) as nome,
  au.email,
  true as ativo,
  NULL as escola_id
FROM auth.users au
LEFT JOIN public.usuarios u ON au.id = u.id
WHERE u.id IS NULL;

-- Atribuir perfil PROFESSOR para usuários sem roles
INSERT INTO public.user_roles (user_id, role, escola_id)
SELECT 
  au.id,
  'PROFESSOR'::app_role,
  NULL
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;