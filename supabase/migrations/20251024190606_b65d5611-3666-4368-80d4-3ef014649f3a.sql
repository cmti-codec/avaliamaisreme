-- Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON public.audit_logs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidade ON public.audit_logs(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para admin ver todos os logs
CREATE POLICY "Admin pode ver todos os logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

-- Função de auditoria para horários
CREATE OR REPLACE FUNCTION public.audit_horarios()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_novos)
    VALUES (auth.uid(), 'INSERT', 'horarios', NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (auth.uid(), 'UPDATE', 'horarios', NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (auth.uid(), 'DELETE', 'horarios', OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar triggers para auditoria
DROP TRIGGER IF EXISTS audit_horarios_trigger ON public.horarios;
CREATE TRIGGER audit_horarios_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.horarios
  FOR EACH ROW EXECUTE FUNCTION public.audit_horarios();

-- Stored procedure para validação de horário
CREATE OR REPLACE FUNCTION public.validar_horario(
  p_turma_id UUID,
  p_dia_semana TEXT,
  p_tempo INTEGER,
  p_componente TEXT,
  p_professor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_erros TEXT[] := '{}';
  v_turma RECORD;
  v_professor RECORD;
  v_conflito INTEGER;
  v_quota_atual INTEGER;
  v_quota_max INTEGER;
BEGIN
  -- Buscar turma
  SELECT * INTO v_turma FROM public.turmas WHERE id = p_turma_id;
  IF NOT FOUND THEN
    v_erros := array_append(v_erros, 'Turma não encontrada');
    RETURN jsonb_build_object('valido', false, 'erros', v_erros);
  END IF;

  -- Buscar professor
  SELECT * INTO v_professor FROM public.professores WHERE id = p_professor_id;
  IF NOT FOUND THEN
    v_erros := array_append(v_erros, 'Professor não encontrado');
    RETURN jsonb_build_object('valido', false, 'erros', v_erros);
  END IF;

  -- Validar quota de componente
  v_quota_max := (v_turma.matriz_curricular->>p_componente)::INTEGER;
  IF v_quota_max IS NULL THEN
    v_erros := array_append(v_erros, 'Componente não está na matriz curricular');
  ELSE
    SELECT COUNT(*) INTO v_quota_atual
    FROM public.horarios
    WHERE turma_id = p_turma_id
      AND componente_curricular = p_componente;
    
    IF v_quota_atual >= v_quota_max THEN
      v_erros := array_append(v_erros, 'Quota do componente excedida');
    END IF;
  END IF;

  -- Validar conflito de professor
  SELECT COUNT(*) INTO v_conflito
  FROM public.horarios h
  INNER JOIN public.turmas t ON h.turma_id = t.id
  WHERE h.professor_id = p_professor_id
    AND h.dia_semana = p_dia_semana
    AND h.tempo = p_tempo
    AND h.turma_id != p_turma_id;
  
  IF v_conflito > 0 THEN
    v_erros := array_append(v_erros, 'Professor já está alocado neste horário');
  END IF;

  -- Validar carga horária
  SELECT COUNT(*) INTO v_conflito
  FROM public.horarios
  WHERE professor_id = p_professor_id;
  
  IF v_conflito >= v_professor.carga_horaria_contratual THEN
    v_erros := array_append(v_erros, 'Carga horária do professor excedida');
  END IF;

  -- Retornar resultado
  IF array_length(v_erros, 1) > 0 THEN
    RETURN jsonb_build_object('valido', false, 'erros', v_erros);
  ELSE
    RETURN jsonb_build_object('valido', true, 'erros', '[]'::jsonb);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;