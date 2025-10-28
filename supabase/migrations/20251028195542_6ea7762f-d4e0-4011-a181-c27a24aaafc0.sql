-- Passo 1: Renomear coluna
ALTER TABLE public.turmas 
RENAME COLUMN segmento TO etapa_modalidade;

-- Passo 2: Mapear valores existentes para os novos padrões
UPDATE public.turmas
SET etapa_modalidade = CASE
  WHEN etapa_modalidade LIKE 'GRUPO%' THEN 'Educação Infantil'
  WHEN etapa_modalidade LIKE '%INFANTIL%' THEN 'Educação Infantil'
  WHEN etapa_modalidade ~ '^[1-5]' OR etapa_modalidade LIKE '%ANOS INICIAIS%' THEN 'Ensino Fundamental I - Anos Iniciais'
  WHEN etapa_modalidade ~ '^[6-9]' OR etapa_modalidade LIKE '%ANOS FINAIS%' THEN 'Ensino Fundamental II - Anos Finais'
  WHEN etapa_modalidade LIKE '%EJA%' THEN 'EJA'
  ELSE 'Educação Infantil'
END;

-- Passo 3: Adicionar constraint
ALTER TABLE public.turmas
ADD CONSTRAINT check_etapa_modalidade 
CHECK (etapa_modalidade IN (
  'Educação Infantil',
  'Ensino Fundamental I - Anos Iniciais',
  'Ensino Fundamental II - Anos Finais',
  'EJA'
));

-- Passo 4: Atualizar índice único
DROP INDEX IF EXISTS idx_turmas_unique_per_escola;
CREATE UNIQUE INDEX idx_turmas_unique_per_escola 
ON public.turmas (escola_id, etapa_modalidade, grupo_ano, turma);

-- Passo 5: Dropar função antiga e criar nova
DROP FUNCTION IF EXISTS public.admin_upsert_turma(uuid, text, text, text, text);

CREATE FUNCTION public.admin_upsert_turma(
  p_escola_id uuid,
  p_etapa_modalidade text,
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
  IF NOT public.has_role(auth.uid(), 'ADMIN') THEN
    RAISE EXCEPTION 'Permissão negada: apenas ADMIN pode criar turmas via importação';
  END IF;

  INSERT INTO public.turmas (escola_id, etapa_modalidade, grupo_ano, turma, turno, ativa)
  VALUES (p_escola_id, p_etapa_modalidade, p_grupo_ano, p_turma, p_turno, true)
  ON CONFLICT (escola_id, etapa_modalidade, grupo_ano, turma)
  DO UPDATE SET
    turno = EXCLUDED.turno,
    ativa = true
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;