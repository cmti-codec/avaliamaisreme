-- =====================================================
-- ESTRUTURA DE GESTÃO DE USUÁRIOS E LOTAÇÕES
-- =====================================================

-- 1. TABELA PESSOAS
CREATE TABLE IF NOT EXISTS public.pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT NOT NULL UNIQUE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  data_nascimento DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para pessoas
CREATE UNIQUE INDEX IF NOT EXISTS idx_pessoas_cpf ON public.pessoas(cpf);
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON public.pessoas(email);

-- Habilitar RLS em pessoas
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;

-- 2. REFATORAR TABELA USUARIOS (adicionar pessoa_id)
-- Adicionar coluna pessoa_id se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'usuarios' 
    AND column_name = 'pessoa_id'
  ) THEN
    ALTER TABLE public.usuarios ADD COLUMN pessoa_id UUID REFERENCES public.pessoas(id);
    ALTER TABLE public.usuarios ADD COLUMN ultimo_acesso TIMESTAMPTZ;
  END IF;
END $$;

-- 3. TABELA LOTACOES (nova estrutura)
CREATE TABLE IF NOT EXISTS public.lotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id UUID NOT NULL REFERENCES public.pessoas(id) ON DELETE CASCADE,
  escola_saesc TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('PROFESSOR', 'COORDENADOR', 'DIRETOR', 'SECRETARIO')),
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  carga_horaria INTEGER,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  
  -- Constraints
  CONSTRAINT check_professor_carga CHECK (
    (perfil = 'PROFESSOR' AND carga_horaria > 0) OR 
    (perfil != 'PROFESSOR')
  ),
  CONSTRAINT check_gestao_sem_carga CHECK (
    (perfil IN ('DIRETOR', 'SECRETARIO') AND carga_horaria IS NULL) OR 
    (perfil NOT IN ('DIRETOR', 'SECRETARIO'))
  )
);

-- Índices para lotacoes
CREATE INDEX IF NOT EXISTS idx_lotacoes_pessoa ON public.lotacoes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_lotacoes_escola ON public.lotacoes(escola_saesc);
CREATE INDEX IF NOT EXISTS idx_lotacoes_perfil ON public.lotacoes(perfil);
CREATE INDEX IF NOT EXISTS idx_lotacoes_pessoa_ativo ON public.lotacoes(pessoa_id, ativo) WHERE ativo = true;

-- Habilitar RLS em lotacoes
ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;

-- 4. TABELA SESSOES_CONTEXTO
CREATE TABLE IF NOT EXISTS public.sessoes_contexto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  lotacao_id UUID NOT NULL REFERENCES public.lotacoes(id) ON DELETE CASCADE,
  escola_saesc TEXT NOT NULL,
  iniciado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em sessoes_contexto
ALTER TABLE public.sessoes_contexto ENABLE ROW LEVEL SECURITY;

-- 5. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.update_lotacoes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_lotacoes_updated_at
  BEFORE UPDATE ON public.lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lotacoes_updated_at();

CREATE TRIGGER trigger_pessoas_updated_at
  BEFORE UPDATE ON public.pessoas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. TRIGGER PARA GESTÃO DE LOTAÇÕES DE DIRETOR/SECRETARIO
CREATE OR REPLACE FUNCTION public.manage_gestao_lotacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for DIRETOR ou SECRETARIO
  IF NEW.perfil IN ('DIRETOR', 'SECRETARIO') THEN
    -- Desativar lotações anteriores do mesmo perfil para a mesma pessoa
    UPDATE public.lotacoes
    SET 
      ativo = false,
      data_fim = CURRENT_DATE,
      updated_at = now()
    WHERE 
      pessoa_id = NEW.pessoa_id 
      AND perfil = NEW.perfil
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    RAISE NOTICE 'Lotações anteriores de % desativadas para pessoa %', NEW.perfil, NEW.pessoa_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_manage_gestao_lotacao
  BEFORE INSERT ON public.lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_gestao_lotacao();

-- 7. VIEW USUARIOS_CONTEXTUALIZADOS
CREATE OR REPLACE VIEW public.usuarios_contextualizados AS
SELECT 
  u.id as usuario_id,
  p.id as pessoa_id,
  p.cpf,
  p.nome_completo,
  p.email,
  p.telefone,
  u.ativo as usuario_ativo,
  COALESCE(
    json_agg(
      json_build_object(
        'lotacao_id', l.id,
        'escola_saesc', l.escola_saesc,
        'escola_nome', e.nome,
        'perfil', l.perfil,
        'carga_horaria', l.carga_horaria,
        'data_inicio', l.data_inicio,
        'data_fim', l.data_fim
      ) ORDER BY l.data_inicio DESC
    ) FILTER (WHERE l.ativo = true),
    '[]'::json
  ) as lotacoes_ativas,
  COUNT(l.id) FILTER (WHERE l.ativo = true) as total_lotacoes_ativas,
  SUM(l.carga_horaria) FILTER (WHERE l.ativo = true AND l.perfil = 'PROFESSOR') as carga_horaria_total
FROM public.usuarios u
JOIN public.pessoas p ON u.pessoa_id = p.id
LEFT JOIN public.lotacoes l ON p.id = l.pessoa_id
LEFT JOIN public.escolas e ON l.escola_saesc = e.saesc::text
WHERE u.ativo = true
GROUP BY u.id, p.id, p.cpf, p.nome_completo, p.email, p.telefone, u.ativo;

-- 8. RLS POLICIES

-- PESSOAS
CREATE POLICY "Admin gerencia pessoas"
  ON public.pessoas
  FOR ALL
  USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
  WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

CREATE POLICY "Usuários veem própria pessoa"
  ON public.pessoas
  FOR SELECT
  USING (
    id IN (
      SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id()
    )
  );

-- LOTACOES
CREATE POLICY "Admin gerencia lotacoes"
  ON public.lotacoes
  FOR ALL
  USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
  WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

CREATE POLICY "Gestores semed veem todas lotacoes"
  ON public.lotacoes
  FOR SELECT
  USING (
    has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
    has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
  );

CREATE POLICY "Usuários veem próprias lotacoes"
  ON public.lotacoes
  FOR SELECT
  USING (
    pessoa_id IN (
      SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id()
    )
  );

CREATE POLICY "Diretores veem lotacoes da escola"
  ON public.lotacoes
  FOR SELECT
  USING (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) AND
    escola_saesc IN (
      SELECT e.saesc::text 
      FROM public.escolas e
      JOIN public.usuarios u ON e.id = u.escola_id
      WHERE u.id = get_effective_user_id()
    )
  );

-- SESSOES_CONTEXTO
CREATE POLICY "Usuários gerenciam próprio contexto"
  ON public.sessoes_contexto
  FOR ALL
  USING (usuario_id = get_effective_user_id())
  WITH CHECK (usuario_id = get_effective_user_id());

CREATE POLICY "Admin gerencia contextos"
  ON public.sessoes_contexto
  FOR ALL
  USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
  WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));