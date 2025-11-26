-- Desabilitar temporariamente a trigger de validação
ALTER TABLE public.lotacoes DISABLE TRIGGER validate_escola_saesc_trigger;

-- Desativar todas as lotações de PROFESSOR para pessoas que têm lotações de gestão ativas
UPDATE public.lotacoes
SET 
  ativo = false,
  data_fim = CURRENT_DATE,
  updated_at = now()
WHERE 
  perfil = 'PROFESSOR'
  AND ativo = true
  AND pessoa_id IN (
    SELECT DISTINCT pessoa_id
    FROM public.lotacoes
    WHERE perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR')
      AND ativo = true
  );

-- Reabilitar a trigger
ALTER TABLE public.lotacoes ENABLE TRIGGER validate_escola_saesc_trigger;

-- Garantir que a trigger de gestão está funcionando corretamente
DROP TRIGGER IF EXISTS manage_gestao_lotacao_trigger ON public.lotacoes;

CREATE OR REPLACE FUNCTION public.manage_gestao_lotacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for cargo de gestão (DIRETOR, SECRETARIO ou COORDENADOR)
  IF NEW.perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR') THEN
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
    
    -- Desativar TODAS as lotações de PROFESSOR dessa pessoa
    UPDATE public.lotacoes
    SET 
      ativo = false,
      data_fim = CURRENT_DATE,
      updated_at = now()
    WHERE 
      pessoa_id = NEW.pessoa_id 
      AND perfil = 'PROFESSOR'
      AND ativo = true;
    
    RAISE NOTICE 'Lotações de gestão e professor desativadas para pessoa % que agora é %', NEW.pessoa_id, NEW.perfil;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_gestao_lotacao_trigger
  BEFORE INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW
  WHEN (NEW.ativo = true AND NEW.perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR'))
  EXECUTE FUNCTION public.manage_gestao_lotacao();