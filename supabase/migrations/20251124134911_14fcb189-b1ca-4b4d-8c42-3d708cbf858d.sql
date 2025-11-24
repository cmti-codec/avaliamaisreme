-- ============================================================================
-- CORREÇÃO DE RECURSÃO INFINITA NAS POLÍTICAS RLS
-- ============================================================================

-- FASE 1: Criar função SECURITY DEFINER para buscar escolas do usuário sem RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_escolas_ids(_user_id uuid DEFAULT NULL)
RETURNS TABLE(escola_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT escola_saesc::uuid
  FROM public.lotacoes
  WHERE pessoa_id = (
    SELECT pessoa_id 
    FROM public.usuarios 
    WHERE id = COALESCE(_user_id, get_effective_user_id())
  )
  AND ativo = true;
$$;

-- FASE 2: Corrigir política da tabela lotacoes
-- ============================================================================
DROP POLICY IF EXISTS "Diretores veem lotacoes da escola lotada" ON public.lotacoes;

CREATE POLICY "Diretores veem lotacoes da escola" ON public.lotacoes
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
  AND escola_saesc::uuid IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- FASE 3: Atualizar políticas RLS em todas as tabelas afetadas
-- ============================================================================

-- TABELA: anos_letivos
-- ============================================================================
DROP POLICY IF EXISTS "escola_ve_proprios_anos" ON public.anos_letivos;

CREATE POLICY "escola_ve_proprios_anos" ON public.anos_letivos
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: bimestres
-- ============================================================================
DROP POLICY IF EXISTS "escola_ve_proprios_bimestres" ON public.bimestres;

CREATE POLICY "escola_ve_proprios_bimestres" ON public.bimestres
FOR SELECT
USING (
  ano_letivo_id IN (
    SELECT id FROM public.anos_letivos
    WHERE escola_id IN (
      SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
    )
  )
);

-- TABELA: dias_nao_letivos
-- ============================================================================
DROP POLICY IF EXISTS "escola_gerencia_proprios_dias" ON public.dias_nao_letivos;
DROP POLICY IF EXISTS "escola_ve_proprios_dias" ON public.dias_nao_letivos;

CREATE POLICY "escola_gerencia_proprios_dias" ON public.dias_nao_letivos
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "escola_ve_proprios_dias" ON public.dias_nao_letivos
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: sabados_letivos
-- ============================================================================
DROP POLICY IF EXISTS "escola_gerencia_proprios_sabados" ON public.sabados_letivos;
DROP POLICY IF EXISTS "escola_ve_proprios_sabados" ON public.sabados_letivos;

CREATE POLICY "escola_gerencia_proprios_sabados" ON public.sabados_letivos
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "escola_ve_proprios_sabados" ON public.sabados_letivos
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: conselhos_classe
-- ============================================================================
DROP POLICY IF EXISTS "escola_gerencia_proprios_conselhos" ON public.conselhos_classe;
DROP POLICY IF EXISTS "escola_ve_proprios_conselhos" ON public.conselhos_classe;

CREATE POLICY "escola_gerencia_proprios_conselhos" ON public.conselhos_classe
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "escola_ve_proprios_conselhos" ON public.conselhos_classe
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: entregas_diarios
-- ============================================================================
DROP POLICY IF EXISTS "escola_gerencia_proprias_entregas" ON public.entregas_diarios;
DROP POLICY IF EXISTS "escola_ve_proprias_entregas" ON public.entregas_diarios;

CREATE POLICY "escola_gerencia_proprias_entregas" ON public.entregas_diarios
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "escola_ve_proprias_entregas" ON public.entregas_diarios
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: eventos_institucionais
-- ============================================================================
DROP POLICY IF EXISTS "escola_gerencia_proprios_eventos" ON public.eventos_institucionais;
DROP POLICY IF EXISTS "escola_ve_proprios_eventos" ON public.eventos_institucionais;

CREATE POLICY "escola_gerencia_proprios_eventos" ON public.eventos_institucionais
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
   OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
   OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "escola_ve_proprios_eventos" ON public.eventos_institucionais
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- TABELA: turmas
-- ============================================================================
DROP POLICY IF EXISTS "Usuários veem turmas da escola lotada" ON public.turmas;
DROP POLICY IF EXISTS "Usuários inserem turmas na escola lotada" ON public.turmas;
DROP POLICY IF EXISTS "Gestores atualizam turmas da escola lotada" ON public.turmas;

CREATE POLICY "Usuários veem turmas da escola lotada" ON public.turmas
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "Usuários inserem turmas na escola lotada" ON public.turmas
FOR INSERT
WITH CHECK (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

CREATE POLICY "Gestores atualizam turmas da escola lotada" ON public.turmas
FOR UPDATE
USING (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
  AND (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
       OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
       OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
)
WITH CHECK (
  escola_id IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
  AND (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
       OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
       OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
);

-- TABELA: alunos
-- ============================================================================
DROP POLICY IF EXISTS "Usuários veem alunos da escola lotada" ON public.alunos;

CREATE POLICY "Usuários veem alunos da escola lotada" ON public.alunos
FOR SELECT
USING (
  saesc IN (
    SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
  )
);

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================