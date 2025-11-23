
-- ============================================
-- MÓDULO: DIÁRIO DE CLASSE
-- Descrição: Sistema de frequências e notas
-- ============================================

-- Tabela de diários de classe
-- Um diário é criado para cada turma/componente/professor
CREATE TABLE IF NOT EXISTS public.diarios_classe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  componente_curricular TEXT NOT NULL,
  ano_letivo TEXT NOT NULL DEFAULT '2025',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(turma_id, professor_id, componente_curricular, ano_letivo)
);

-- Tabela de registros de frequência (lançamentos diários)
CREATE TABLE IF NOT EXISTS public.frequencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id UUID NOT NULL REFERENCES public.diarios_classe(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data_aula DATE NOT NULL,
  tempo INTEGER NOT NULL, -- qual tempo/hora-aula
  presente BOOLEAN NOT NULL DEFAULT true,
  justificativa TEXT,
  observacao TEXT,
  lancado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lancado_por UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(diario_id, aluno_id, data_aula, tempo)
);

-- Tabela de notas/avaliações
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id UUID NOT NULL REFERENCES public.diarios_classe(id) ON DELETE CASCADE,
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  tipo_avaliacao TEXT NOT NULL, -- 'PROVA', 'TRABALHO', 'PARTICIPACAO', etc
  titulo TEXT NOT NULL,
  data_avaliacao DATE NOT NULL,
  nota DECIMAL(5,2),
  nota_maxima DECIMAL(5,2) DEFAULT 10.0,
  observacao TEXT,
  lancado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  lancado_por UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_diarios_turma ON public.diarios_classe(turma_id);
CREATE INDEX IF NOT EXISTS idx_diarios_professor ON public.diarios_classe(professor_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_diario ON public.frequencias(diario_id);
CREATE INDEX IF NOT EXISTS idx_frequencias_data ON public.frequencias(data_aula);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_diario ON public.avaliacoes(diario_id);

-- Trigger para updated_at
CREATE TRIGGER update_diarios_updated_at
  BEFORE UPDATE ON public.diarios_classe
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_frequencias_updated_at
  BEFORE UPDATE ON public.frequencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avaliacoes_updated_at
  BEFORE UPDATE ON public.avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES - DIÁRIOS DE CLASSE
-- ============================================

ALTER TABLE public.diarios_classe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frequencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- DIÁRIOS: Admin vê tudo
CREATE POLICY "Admin vê todos diários"
  ON public.diarios_classe FOR SELECT
  USING (has_role(get_effective_user_id(), 'ADMIN'));

-- DIÁRIOS: Professor vê seus próprios diários
CREATE POLICY "Professores veem próprios diários"
  ON public.diarios_classe FOR SELECT
  USING (
    professor_id IN (
      SELECT id FROM public.professores 
      WHERE usuario_id = get_effective_user_id()
    )
  );

-- DIÁRIOS: Gestores veem diários da escola
CREATE POLICY "Gestores veem diários da escola"
  ON public.diarios_classe FOR SELECT
  USING (
    (has_role(get_effective_user_id(), 'DIRETOR') 
     OR has_role(get_effective_user_id(), 'SECRETARIO')
     OR has_role(get_effective_user_id(), 'COORDENADOR'))
    AND turma_id IN (
      SELECT t.id FROM turmas t
      JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
      WHERE l.pessoa_id = (
        SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
      )
      AND l.ativo = true
    )
  );

-- DIÁRIOS: Admin pode criar/atualizar
CREATE POLICY "Admin gerencia diários"
  ON public.diarios_classe FOR ALL
  USING (has_role(get_effective_user_id(), 'ADMIN'))
  WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'));

-- FREQUÊNCIAS: Admin vê tudo
CREATE POLICY "Admin vê todas frequências"
  ON public.frequencias FOR SELECT
  USING (has_role(get_effective_user_id(), 'ADMIN'));

-- FREQUÊNCIAS: Professor vê/edita suas frequências
CREATE POLICY "Professores gerenciam próprias frequências"
  ON public.frequencias FOR ALL
  USING (
    diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE professor_id IN (
        SELECT id FROM public.professores 
        WHERE usuario_id = get_effective_user_id()
      )
    )
  )
  WITH CHECK (
    diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE professor_id IN (
        SELECT id FROM public.professores 
        WHERE usuario_id = get_effective_user_id()
      )
    )
  );

-- FREQUÊNCIAS: Gestores veem frequências da escola
CREATE POLICY "Gestores veem frequências da escola"
  ON public.frequencias FOR SELECT
  USING (
    (has_role(get_effective_user_id(), 'DIRETOR') 
     OR has_role(get_effective_user_id(), 'SECRETARIO')
     OR has_role(get_effective_user_id(), 'COORDENADOR'))
    AND diario_id IN (
      SELECT d.id FROM diarios_classe d
      JOIN turmas t ON t.id = d.turma_id
      JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
      WHERE l.pessoa_id = (
        SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
      )
      AND l.ativo = true
    )
  );

-- AVALIAÇÕES: Mesmas políticas das frequências
CREATE POLICY "Admin vê todas avaliações"
  ON public.avaliacoes FOR SELECT
  USING (has_role(get_effective_user_id(), 'ADMIN'));

CREATE POLICY "Professores gerenciam próprias avaliações"
  ON public.avaliacoes FOR ALL
  USING (
    diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE professor_id IN (
        SELECT id FROM public.professores 
        WHERE usuario_id = get_effective_user_id()
      )
    )
  )
  WITH CHECK (
    diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE professor_id IN (
        SELECT id FROM public.professores 
        WHERE usuario_id = get_effective_user_id()
      )
    )
  );

CREATE POLICY "Gestores veem avaliações da escola"
  ON public.avaliacoes FOR SELECT
  USING (
    (has_role(get_effective_user_id(), 'DIRETOR') 
     OR has_role(get_effective_user_id(), 'SECRETARIO')
     OR has_role(get_effective_user_id(), 'COORDENADOR'))
    AND diario_id IN (
      SELECT d.id FROM diarios_classe d
      JOIN turmas t ON t.id = d.turma_id
      JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
      WHERE l.pessoa_id = (
        SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
      )
      AND l.ativo = true
    )
  );

-- ============================================
-- FUNÇÃO: Sincronizar diários com horários
-- ============================================
CREATE OR REPLACE FUNCTION public.sincronizar_diarios_com_horarios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir diários baseados nos horários existentes
  INSERT INTO public.diarios_classe (turma_id, professor_id, componente_curricular, ano_letivo)
  SELECT DISTINCT
    h.turma_id,
    h.professor_id,
    h.componente_curricular,
    '2025' as ano_letivo
  FROM public.horarios h
  ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo) 
  DO NOTHING;
END;
$$;

-- Executar sincronização inicial
SELECT public.sincronizar_diarios_com_horarios();

COMMENT ON TABLE public.diarios_classe IS 'Diários de classe para lançamento de frequências e notas';
COMMENT ON TABLE public.frequencias IS 'Registro diário de frequência dos alunos';
COMMENT ON TABLE public.avaliacoes IS 'Avaliações e notas dos alunos';
