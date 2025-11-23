-- =====================================================
-- MÓDULO DATAS & PRAZOS - FASE 1: ESTRUTURA DE BANCO
-- =====================================================

-- 1. TABELA: Anos Letivos
CREATE TABLE IF NOT EXISTS public.anos_letivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(escola_id, ano),
  CHECK (data_fim > data_inicio),
  CHECK (ano >= 2020 AND ano <= 2050)
);

-- 2. TABELA: Bimestres (gerados automaticamente)
CREATE TABLE IF NOT EXISTS public.bimestres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_letivo_id UUID NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL CHECK (numero BETWEEN 1 AND 4),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ano_letivo_id, numero),
  CHECK (data_fim > data_inicio)
);

-- 3. TABELA: Exames Finais
CREATE TABLE IF NOT EXISTS public.exames_finais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ano_letivo_id UUID NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(ano_letivo_id)
);

-- 4. TABELA: Feriados (gerenciado pela REDE)
CREATE TABLE IF NOT EXISTS public.feriados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('FERIADO', 'PONTO_FACULTATIVO')),
  abrangencia TEXT NOT NULL CHECK (abrangencia IN ('NACIONAL', 'ESTADUAL', 'MUNICIPAL')),
  ano INTEGER NOT NULL,
  compensacao_sabado_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(data, tipo)
);

-- 5. TABELA: Dias Não Letivos Extraordinários
CREATE TABLE IF NOT EXISTS public.dias_nao_letivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  origem TEXT NOT NULL CHECK (origem IN ('REDE', 'ESCOLA')),
  precisa_compensacao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id)
);

-- 6. TABELA: Sábados Letivos
CREATE TABLE IF NOT EXISTS public.sabados_letivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('REPLICA_DIA_SEMANA', 'EVENTO_GERAL')),
  dia_replica TEXT CHECK (dia_replica IN ('SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA')),
  segmentos JSONB,
  turnos JSONB,
  descricao TEXT,
  exige_chamada BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(escola_id, data),
  CHECK (
    (tipo = 'REPLICA_DIA_SEMANA' AND dia_replica IS NOT NULL) OR
    (tipo = 'EVENTO_GERAL' AND descricao IS NOT NULL)
  )
);

-- 7. TABELA: Conselhos de Classe
CREATE TABLE IF NOT EXISTS public.conselhos_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  ano_letivo_id UUID NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
  bimestre_id UUID NOT NULL REFERENCES public.bimestres(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT,
  turmas_ids JSONB,
  segmentos JSONB,
  bloqueia_edicao_avaliacoes BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(escola_id, bimestre_id)
);

-- 8. TABELA: Entrega de Diários
CREATE TABLE IF NOT EXISTS public.entregas_diarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  ano_letivo_id UUID NOT NULL REFERENCES public.anos_letivos(id) ON DELETE CASCADE,
  bimestre_id UUID NOT NULL REFERENCES public.bimestres(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT,
  turmas_ids JSONB,
  segmentos JSONB,
  professores_entregaram JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id),
  UNIQUE(escola_id, bimestre_id)
);

-- 9. TABELA: Eventos Institucionais Diversos
CREATE TABLE IF NOT EXISTS public.eventos_institucionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL,
  participantes JSONB,
  bloqueia_letivo BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id)
);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- FUNÇÃO: Criar bimestres automaticamente ao criar ano letivo
CREATE OR REPLACE FUNCTION public.criar_bimestres_automaticamente()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  duracao_total INTEGER;
  duracao_bimestre NUMERIC;
  data_atual DATE;
  data_fim_bimestre DATE;
BEGIN
  -- Calcular duração total e por bimestre
  duracao_total := NEW.data_fim - NEW.data_inicio;
  duracao_bimestre := duracao_total / 4.0;
  data_atual := NEW.data_inicio;
  
  -- Criar 4 bimestres
  FOR i IN 1..4 LOOP
    IF i = 4 THEN
      -- Último bimestre vai até o final do ano letivo
      data_fim_bimestre := NEW.data_fim;
    ELSE
      data_fim_bimestre := data_atual + FLOOR(duracao_bimestre)::INTEGER;
    END IF;
    
    INSERT INTO public.bimestres (ano_letivo_id, numero, data_inicio, data_fim)
    VALUES (
      NEW.id,
      i,
      data_atual,
      data_fim_bimestre
    );
    
    -- Próximo bimestre começa no dia seguinte
    data_atual := data_fim_bimestre + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- TRIGGER: Criar bimestres após inserir ano letivo
DROP TRIGGER IF EXISTS trigger_criar_bimestres ON public.anos_letivos;
CREATE TRIGGER trigger_criar_bimestres
AFTER INSERT ON public.anos_letivos
FOR EACH ROW
EXECUTE FUNCTION public.criar_bimestres_automaticamente();

-- FUNÇÃO: Adicionar FK após criação da tabela sabados_letivos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'feriados_compensacao_sabado_id_fkey'
  ) THEN
    ALTER TABLE public.feriados
    ADD CONSTRAINT feriados_compensacao_sabado_id_fkey
    FOREIGN KEY (compensacao_sabado_id)
    REFERENCES public.sabados_letivos(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.anos_letivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bimestres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exames_finais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dias_nao_letivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sabados_letivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conselhos_classe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_institucionais ENABLE ROW LEVEL SECURITY;

-- ========== ANOS LETIVOS ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_todos_anos" ON public.anos_letivos
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Admin/Rede gerenciam todos
CREATE POLICY "admin_rede_gerenciam_anos" ON public.anos_letivos
FOR ALL
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
)
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios anos
CREATE POLICY "escola_ve_proprios_anos" ON public.anos_letivos
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- ========== BIMESTRES ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_bimestres" ON public.bimestres
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios bimestres
CREATE POLICY "escola_ve_proprios_bimestres" ON public.bimestres
FOR SELECT
USING (
  ano_letivo_id IN (
    SELECT id FROM public.anos_letivos
    WHERE escola_id IN (
      SELECT escola_saesc::uuid FROM public.lotacoes
      WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
      AND ativo = true
    )
  )
);

-- Admin/Rede editam bimestres
CREATE POLICY "admin_rede_editam_bimestres" ON public.bimestres
FOR UPDATE
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
)
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- ========== EXAMES FINAIS ==========

-- Admin/Rede gerenciam exames
CREATE POLICY "admin_rede_gerenciam_exames" ON public.exames_finais
FOR ALL
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
)
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios exames
CREATE POLICY "escola_ve_proprios_exames" ON public.exames_finais
FOR SELECT
USING (
  ano_letivo_id IN (
    SELECT id FROM public.anos_letivos
    WHERE escola_id IN (
      SELECT escola_saesc::uuid FROM public.lotacoes
      WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
      AND ativo = true
    )
  )
);

-- ========== FERIADOS ==========

-- Todos veem feriados
CREATE POLICY "todos_veem_feriados" ON public.feriados
FOR SELECT
USING (true);

-- Apenas rede gerencia feriados
CREATE POLICY "rede_gerencia_feriados" ON public.feriados
FOR ALL
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
)
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- ========== DIAS NÃO LETIVOS ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_dias_nao_letivos" ON public.dias_nao_letivos
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios dias não letivos
CREATE POLICY "escola_ve_proprios_dias_nao_letivos" ON public.dias_nao_letivos
FOR SELECT
USING (
  escola_id IS NULL OR
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- Rede gerencia dias não letivos da rede
CREATE POLICY "rede_gerencia_dias_nao_letivos_rede" ON public.dias_nao_letivos
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
   has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
   has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)) AND
  (escola_id IS NULL OR origem = 'REDE')
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
   has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
   has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)) AND
  origem = 'REDE'
);

-- Escola gerencia próprios dias não letivos
CREATE POLICY "escola_gerencia_proprios_dias_nao_letivos" ON public.dias_nao_letivos
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  ) AND
  origem = 'ESCOLA'
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  ) AND
  origem = 'ESCOLA'
);

-- ========== SÁBADOS LETIVOS ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_sabados" ON public.sabados_letivos
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios sábados
CREATE POLICY "escola_ve_proprios_sabados" ON public.sabados_letivos
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- Escola gerencia próprios sábados
CREATE POLICY "escola_gerencia_proprios_sabados" ON public.sabados_letivos
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- ========== CONSELHOS DE CLASSE ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_conselhos" ON public.conselhos_classe
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios conselhos
CREATE POLICY "escola_ve_proprios_conselhos" ON public.conselhos_classe
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- Escola gerencia próprios conselhos
CREATE POLICY "escola_gerencia_proprios_conselhos" ON public.conselhos_classe
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- ========== ENTREGAS DE DIÁRIOS ==========

-- Admin/Rede veem todas
CREATE POLICY "admin_rede_veem_entregas" ON public.entregas_diarios
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprias entregas
CREATE POLICY "escola_ve_proprias_entregas" ON public.entregas_diarios
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- Escola gerencia próprias entregas
CREATE POLICY "escola_gerencia_proprias_entregas" ON public.entregas_diarios
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- ========== EVENTOS INSTITUCIONAIS ==========

-- Admin/Rede veem todos
CREATE POLICY "admin_rede_veem_eventos" ON public.eventos_institucionais
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Escola vê próprios eventos
CREATE POLICY "escola_ve_proprios_eventos" ON public.eventos_institucionais
FOR SELECT
USING (
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- Escola gerencia próprios eventos
CREATE POLICY "escola_gerencia_proprios_eventos" ON public.eventos_institucionais
FOR ALL
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role)) AND
  escola_id IN (
    SELECT escola_saesc::uuid FROM public.lotacoes
    WHERE pessoa_id = (SELECT pessoa_id FROM public.usuarios WHERE id = get_effective_user_id())
    AND ativo = true
  )
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_anos_letivos_escola ON public.anos_letivos(escola_id);
CREATE INDEX IF NOT EXISTS idx_anos_letivos_ano ON public.anos_letivos(ano);
CREATE INDEX IF NOT EXISTS idx_bimestres_ano_letivo ON public.bimestres(ano_letivo_id);
CREATE INDEX IF NOT EXISTS idx_feriados_data ON public.feriados(data);
CREATE INDEX IF NOT EXISTS idx_feriados_ano ON public.feriados(ano);
CREATE INDEX IF NOT EXISTS idx_dias_nao_letivos_data ON public.dias_nao_letivos(data);
CREATE INDEX IF NOT EXISTS idx_dias_nao_letivos_escola ON public.dias_nao_letivos(escola_id);
CREATE INDEX IF NOT EXISTS idx_sabados_letivos_data ON public.sabados_letivos(data);
CREATE INDEX IF NOT EXISTS idx_sabados_letivos_escola ON public.sabados_letivos(escola_id);
CREATE INDEX IF NOT EXISTS idx_conselhos_escola_bimestre ON public.conselhos_classe(escola_id, bimestre_id);
CREATE INDEX IF NOT EXISTS idx_entregas_escola_bimestre ON public.entregas_diarios(escola_id, bimestre_id);
CREATE INDEX IF NOT EXISTS idx_eventos_escola_data ON public.eventos_institucionais(escola_id, data);