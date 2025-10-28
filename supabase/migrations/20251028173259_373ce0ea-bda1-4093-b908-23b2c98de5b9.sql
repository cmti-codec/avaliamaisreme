-- Criar função para upsert de turmas durante importação (apenas ADMIN)
CREATE OR REPLACE FUNCTION public.admin_upsert_turma(
  p_escola_id uuid,
  p_segmento text,
  p_grupo_ano text,
  p_turma text,
  p_turno text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Garante que apenas ADMIN use
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Permissão negada: apenas ADMIN pode criar turmas via importação';
  END IF;

  -- Busca turma existente
  SELECT id INTO v_id
  FROM public.turmas
  WHERE escola_id = p_escola_id
    AND segmento = p_segmento
    AND turma = p_turma
    AND COALESCE(turno, '') = COALESCE(p_turno, '')
  LIMIT 1;

  -- Se encontrou, retorna
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- Senão, cria nova turma
  INSERT INTO public.turmas (escola_id, segmento, grupo_ano, turma, turno, ativa)
  VALUES (p_escola_id, p_segmento, p_grupo_ano, p_turma, p_turno, true)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;