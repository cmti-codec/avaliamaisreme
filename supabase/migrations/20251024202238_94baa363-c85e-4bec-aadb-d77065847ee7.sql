-- Alterar coluna changed_by para permitir NULL
ALTER TABLE public.audit_roles ALTER COLUMN changed_by DROP NOT NULL;

-- Modificar função para usar NULL quando não há usuário autenticado
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_roles (user_id, action, role, changed_by)
    VALUES (NEW.user_id, 'ADDED', NEW.role, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_roles (user_id, action, role, changed_by)
    VALUES (OLD.user_id, 'REMOVED', OLD.role, auth.uid());
  END IF;
  RETURN NULL;
END;
$function$;

-- Inserir usuário admin em public.usuarios
INSERT INTO public.usuarios (id, nome, email, ativo, escola_id)
VALUES (
  '12f4cadb-7348-4615-8808-7806c8c04ae9',
  'Administrador',
  'prof.guilhermeferrari@gmail.com',
  true,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  ativo = EXCLUDED.ativo;

-- Inserir role ADMIN em public.user_roles
INSERT INTO public.user_roles (user_id, role, escola_id)
VALUES (
  '12f4cadb-7348-4615-8808-7806c8c04ae9',
  'ADMIN'::app_role,
  NULL
)
ON CONFLICT (user_id, role) DO NOTHING;