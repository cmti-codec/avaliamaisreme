-- 1. Criar VIEW unificada de usuários com seus perfis e dados de professor
CREATE OR REPLACE VIEW public.usuarios_completos AS
SELECT 
  u.id,
  u.nome,
  u.email,
  u.ativo,
  u.escola_id,
  u.created_at,
  u.impersonated_by,
  -- Agregação de roles
  COALESCE(
    json_agg(DISTINCT ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL),
    '[]'::json
  ) as roles,
  -- Dados específicos de professor (se aplicável)
  p.id as professor_id,
  p.cpf,
  p.matricula,
  p.telefone,
  p.formacoes,
  p.carga_horaria_contratual,
  p.cargo,
  p.funcao_atual,
  p.tipo_vinculo,
  p.horas_pl
FROM public.usuarios u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.professores p ON p.usuario_id = u.id
GROUP BY u.id, u.nome, u.email, u.ativo, u.escola_id, u.created_at, u.impersonated_by,
         p.id, p.cpf, p.matricula, p.telefone, p.formacoes, p.carga_horaria_contratual,
         p.cargo, p.funcao_atual, p.tipo_vinculo, p.horas_pl;

-- 2. Criar função que cria automaticamente registro de professor quando role é atribuída
CREATE OR REPLACE FUNCTION public.auto_create_professor_on_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se a role sendo inserida é PROFESSOR
  IF NEW.role = 'PROFESSOR' THEN
    -- Verificar se já existe registro de professor para este usuário
    IF NOT EXISTS (
      SELECT 1 FROM public.professores WHERE usuario_id = NEW.user_id
    ) THEN
      -- Criar registro de professor automaticamente
      INSERT INTO public.professores (
        usuario_id,
        nome,
        email,
        ativo,
        carga_horaria_contratual
      )
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.ativo,
        20 -- valor padrão de 20h
      FROM public.usuarios u
      WHERE u.id = NEW.user_id;
      
      RAISE NOTICE 'Professor criado automaticamente para usuário %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Criar trigger na tabela user_roles
DROP TRIGGER IF EXISTS trigger_auto_create_professor ON public.user_roles;
CREATE TRIGGER trigger_auto_create_professor
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_professor_on_role();

-- 4. Sincronizar dados existentes: preencher registros de professor faltantes
INSERT INTO public.professores (usuario_id, nome, email, ativo, carga_horaria_contratual)
SELECT DISTINCT
  ur.user_id,
  u.nome,
  u.email,
  u.ativo,
  20 -- valor padrão
FROM public.user_roles ur
INNER JOIN public.usuarios u ON u.id = ur.user_id
WHERE ur.role = 'PROFESSOR'
  AND NOT EXISTS (
    SELECT 1 FROM public.professores p WHERE p.usuario_id = ur.user_id
  )
ON CONFLICT (usuario_id) DO NOTHING;

-- 5. Atualizar a função de sincronização usuarios->professores para usar JOIN
CREATE OR REPLACE FUNCTION public.sync_usuario_to_professor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar professor quando usuario for atualizado
  UPDATE public.professores
  SET 
    nome = NEW.nome,
    email = NEW.email,
    ativo = NEW.ativo
  WHERE usuario_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 6. Garantir que trigger de sincronização existe
DROP TRIGGER IF EXISTS sync_usuario_to_professor_trigger ON public.usuarios;
CREATE TRIGGER sync_usuario_to_professor_trigger
  AFTER UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_usuario_to_professor();

COMMENT ON VIEW public.usuarios_completos IS 'View unificada que combina dados de usuários, roles e informações específicas de professor';
COMMENT ON FUNCTION public.auto_create_professor_on_role() IS 'Cria automaticamente registro de professor quando role PROFESSOR é atribuída';
COMMENT ON TRIGGER trigger_auto_create_professor ON public.user_roles IS 'Trigger que dispara criação automática de professor';