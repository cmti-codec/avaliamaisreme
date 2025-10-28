-- Passo 1: Deletar turmas duplicadas mantendo apenas a mais recente de cada conjunto
WITH turmas_ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY escola_id, segmento, grupo_ano, turma 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM public.turmas
)
DELETE FROM public.turmas
WHERE id IN (
  SELECT id FROM turmas_ranked WHERE rn > 1
);

-- Passo 2: Criar índice único para prevenir duplicatas futuras
CREATE UNIQUE INDEX IF NOT EXISTS idx_turmas_unique_per_escola 
ON public.turmas (escola_id, segmento, grupo_ano, turma);

-- Passo 3: Melhorar a função admin_upsert_turma para fazer UPSERT correto
CREATE OR REPLACE FUNCTION public.admin_upsert_turma(
  p_escola_id uuid,
  p_segmento text,
  p_grupo_ano text,
  p_turma text,
  p_turno text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  -- Garante que apenas ADMIN use
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Permissão negada: apenas ADMIN pode criar turmas via importação';
  END IF;

  -- Tenta fazer UPSERT baseado em escola_id, segmento, grupo_ano e turma
  INSERT INTO public.turmas (escola_id, segmento, grupo_ano, turma, turno, ativa)
  VALUES (p_escola_id, p_segmento, p_grupo_ano, p_turma, p_turno, true)
  ON CONFLICT (escola_id, segmento, grupo_ano, turma)
  DO UPDATE SET
    turno = EXCLUDED.turno,
    ativa = true
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;