-- Modificar trigger para encerrar lotações de PROFESSOR quando pessoa vira gestor
CREATE OR REPLACE FUNCTION public.manage_gestao_lotacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    -- (quando vira gestor, deixa de ser professor)
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
$function$;