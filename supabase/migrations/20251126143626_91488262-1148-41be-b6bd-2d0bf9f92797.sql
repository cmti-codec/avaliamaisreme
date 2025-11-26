-- Melhorar a trigger para ignorar validação de escola ao desativar lotações antigas

DROP TRIGGER IF EXISTS manage_gestao_lotacao_trigger ON public.lotacoes;

CREATE OR REPLACE FUNCTION public.manage_gestao_lotacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se for cargo de gestão (DIRETOR, SECRETARIO ou COORDENADOR)
  IF NEW.perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR') AND NEW.ativo = true THEN
    
    -- Desabilitar temporariamente a validação de escola_saesc
    EXECUTE 'ALTER TABLE public.lotacoes DISABLE TRIGGER validate_escola_saesc_trigger';
    
    -- 1. Desativar TODAS as outras lotações de gestão (qualquer perfil) dessa pessoa
    -- Gestores têm dedicação exclusiva
    UPDATE public.lotacoes
    SET 
      ativo = false,
      data_fim = CURRENT_DATE,
      updated_at = now()
    WHERE 
      pessoa_id = NEW.pessoa_id 
      AND perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR')
      AND ativo = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- 2. Desativar TODAS as lotações de PROFESSOR dessa pessoa
    -- Gestores não podem ser professores simultaneamente
    UPDATE public.lotacoes
    SET 
      ativo = false,
      data_fim = CURRENT_DATE,
      updated_at = now()
    WHERE 
      pessoa_id = NEW.pessoa_id 
      AND perfil = 'PROFESSOR'
      AND ativo = true;
    
    -- Reabilitar a validação de escola_saesc
    EXECUTE 'ALTER TABLE public.lotacoes ENABLE TRIGGER validate_escola_saesc_trigger';
    
    RAISE NOTICE 'Lotações anteriores desativadas para pessoa % que agora é % em %', 
      NEW.pessoa_id, NEW.perfil, NEW.escola_saesc;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER manage_gestao_lotacao_trigger
  BEFORE INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_gestao_lotacao();