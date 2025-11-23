
-- ============================================
-- ADAPTAÇÃO: Diários para Turmas Integrais
-- ============================================

-- Adicionar campo turno_diario para distinguir manhã/tarde
ALTER TABLE public.diarios_classe 
  ADD COLUMN IF NOT EXISTS turno_diario TEXT;

-- Adicionar campo para identificar se é diário de atividades diversas (secretário)
ALTER TABLE public.diarios_classe 
  ADD COLUMN IF NOT EXISTS tipo_diario TEXT DEFAULT 'REGULAR';

-- Comentar tipos: REGULAR (professor), ATIVIDADES_DIVERSAS (secretário)
COMMENT ON COLUMN public.diarios_classe.tipo_diario IS 'REGULAR (professor) ou ATIVIDADES_DIVERSAS (secretário)';
COMMENT ON COLUMN public.diarios_classe.turno_diario IS 'MATUTINO, VESPERTINO ou null para turno único';

-- Remover constraint única antiga e criar nova considerando turno
ALTER TABLE public.diarios_classe 
  DROP CONSTRAINT IF EXISTS diarios_classe_turma_id_professor_id_componente_curricular_key;

-- Nova constraint única incluindo turno
ALTER TABLE public.diarios_classe 
  ADD CONSTRAINT diarios_classe_unique_key 
  UNIQUE (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario);

-- ============================================
-- FUNÇÃO MELHORADA: Sincronizar diários
-- ============================================
CREATE OR REPLACE FUNCTION public.sincronizar_diarios_com_horarios()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_horario RECORD;
  v_turma RECORD;
  v_turno_diario TEXT;
BEGIN
  -- Iterar por todos os horários
  FOR v_horario IN 
    SELECT DISTINCT
      h.turma_id,
      h.professor_id,
      h.componente_curricular,
      t.turno,
      t.grupo_ano,
      t.etapa_modalidade
    FROM public.horarios h
    JOIN public.turmas t ON t.id = h.turma_id
  LOOP
    -- Verificar se é turma integral de grupos 1, 1I, 1II, 2 ou 3
    IF v_horario.turno = 'INTEGRAL' 
       AND v_horario.grupo_ano IN ('1º ANO', '1I', '1II', '2º ANO', '3º ANO') THEN
      
      -- Para turmas integrais, criar 2 diários: manhã e tarde
      -- Diário MATUTINO
      INSERT INTO public.diarios_classe (
        turma_id, 
        professor_id, 
        componente_curricular, 
        ano_letivo,
        turno_diario,
        tipo_diario
      )
      VALUES (
        v_horario.turma_id,
        v_horario.professor_id,
        v_horario.componente_curricular,
        '2025',
        'MATUTINO',
        'REGULAR'
      )
      ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario) 
      DO NOTHING;
      
      -- Diário VESPERTINO
      INSERT INTO public.diarios_classe (
        turma_id, 
        professor_id, 
        componente_curricular, 
        ano_letivo,
        turno_diario,
        tipo_diario
      )
      VALUES (
        v_horario.turma_id,
        v_horario.professor_id,
        v_horario.componente_curricular,
        '2025',
        'VESPERTINO',
        'REGULAR'
      )
      ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario) 
      DO NOTHING;
      
    ELSE
      -- Para turmas não integrais, criar diário normal
      INSERT INTO public.diarios_classe (
        turma_id, 
        professor_id, 
        componente_curricular, 
        ano_letivo,
        turno_diario,
        tipo_diario
      )
      VALUES (
        v_horario.turma_id,
        v_horario.professor_id,
        v_horario.componente_curricular,
        '2025',
        NULL,
        'REGULAR'
      )
      ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario) 
      DO NOTHING;
    END IF;
  END LOOP;
  
  -- Criar diários para ATIVIDADES DIVERSAS (secretário)
  -- Buscar turmas integrais dos grupos especificados
  FOR v_turma IN 
    SELECT DISTINCT
      t.id as turma_id,
      t.escola_id
    FROM public.turmas t
    WHERE t.turno = 'INTEGRAL'
      AND t.grupo_ano IN ('1º ANO', '1I', '1II', '2º ANO', '3º ANO')
      AND t.ativa = true
  LOOP
    -- Buscar secretário da escola (primeiro encontrado)
    DECLARE
      v_secretario_pessoa_id UUID;
    BEGIN
      SELECT pessoa_id INTO v_secretario_pessoa_id
      FROM public.lotacoes
      WHERE escola_saesc::uuid = v_turma.escola_id
        AND perfil = 'SECRETARIO'
        AND ativo = true
      LIMIT 1;
      
      IF v_secretario_pessoa_id IS NOT NULL THEN
        -- Criar diário de atividades diversas para manhã
        INSERT INTO public.diarios_classe (
          turma_id,
          professor_id,
          componente_curricular,
          ano_letivo,
          turno_diario,
          tipo_diario
        )
        SELECT 
          v_turma.turma_id,
          p.id,
          'Atividades Diversas',
          '2025',
          'MATUTINO',
          'ATIVIDADES_DIVERSAS'
        FROM public.professores p
        WHERE p.funcao_atual = 'SECRETARIO'
          AND p.escola_id = v_turma.escola_id
        LIMIT 1
        ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario) 
        DO NOTHING;
        
        -- Criar diário de atividades diversas para tarde
        INSERT INTO public.diarios_classe (
          turma_id,
          professor_id,
          componente_curricular,
          ano_letivo,
          turno_diario,
          tipo_diario
        )
        SELECT 
          v_turma.turma_id,
          p.id,
          'Atividades Diversas',
          '2025',
          'VESPERTINO',
          'ATIVIDADES_DIVERSAS'
        FROM public.professores p
        WHERE p.funcao_atual = 'SECRETARIO'
          AND p.escola_id = v_turma.escola_id
        LIMIT 1
        ON CONFLICT (turma_id, professor_id, componente_curricular, ano_letivo, turno_diario) 
        DO NOTHING;
      END IF;
    END;
  END LOOP;
END;
$$;

-- Executar sincronização inicial
SELECT public.sincronizar_diarios_com_horarios();

-- ============================================
-- RLS ADICIONAL: Secretários veem/editam atividades diversas
-- ============================================

-- Secretários podem ver diários de atividades diversas da escola
CREATE POLICY "Secretários veem atividades diversas da escola"
  ON public.diarios_classe FOR SELECT
  USING (
    has_role(get_effective_user_id(), 'SECRETARIO')
    AND tipo_diario = 'ATIVIDADES_DIVERSAS'
    AND turma_id IN (
      SELECT t.id FROM turmas t
      JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
      WHERE l.pessoa_id = (
        SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
      )
      AND l.ativo = true
    )
  );

-- Secretários podem gerenciar frequências de atividades diversas
CREATE POLICY "Secretários gerenciam frequências atividades diversas"
  ON public.frequencias FOR ALL
  USING (
    has_role(get_effective_user_id(), 'SECRETARIO')
    AND diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE tipo_diario = 'ATIVIDADES_DIVERSAS'
      AND turma_id IN (
        SELECT t.id FROM turmas t
        JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
        WHERE l.pessoa_id = (
          SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
        )
        AND l.ativo = true
      )
    )
  )
  WITH CHECK (
    has_role(get_effective_user_id(), 'SECRETARIO')
    AND diario_id IN (
      SELECT id FROM public.diarios_classe
      WHERE tipo_diario = 'ATIVIDADES_DIVERSAS'
      AND turma_id IN (
        SELECT t.id FROM turmas t
        JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
        WHERE l.pessoa_id = (
          SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()
        )
        AND l.ativo = true
      )
    )
  );

-- ============================================
-- FUNÇÃO: Calcular frequência total (soma turnos)
-- ============================================
CREATE OR REPLACE FUNCTION public.calcular_frequencia_total_aluno(
  p_turma_id UUID,
  p_aluno_id UUID,
  p_componente TEXT,
  p_data_inicio DATE,
  p_data_fim DATE
)
RETURNS TABLE (
  total_aulas INTEGER,
  total_presencas INTEGER,
  total_faltas INTEGER,
  percentual_presenca NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_aulas,
    COUNT(*) FILTER (WHERE f.presente = true)::INTEGER as total_presencas,
    COUNT(*) FILTER (WHERE f.presente = false)::INTEGER as total_faltas,
    ROUND(
      (COUNT(*) FILTER (WHERE f.presente = true)::NUMERIC / COUNT(*)::NUMERIC * 100), 
      2
    ) as percentual_presenca
  FROM public.frequencias f
  JOIN public.diarios_classe d ON d.id = f.diario_id
  WHERE d.turma_id = p_turma_id
    AND f.aluno_id = p_aluno_id
    AND d.componente_curricular = p_componente
    AND f.data_aula BETWEEN p_data_inicio AND p_data_fim;
END;
$$;

COMMENT ON FUNCTION public.calcular_frequencia_total_aluno IS 'Calcula frequência total somando todos os turnos (manhã + tarde + atividades diversas)';
