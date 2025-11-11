-- Fase 2 Final: Ajustar validação de escola_saesc para permitir POOL_REME

-- Drop trigger e função com CASCADE
DROP TRIGGER IF EXISTS validate_escola_saesc_trigger ON public.lotacoes;
DROP TRIGGER IF EXISTS validate_lotacoes_escola ON public.lotacoes;
DROP FUNCTION IF EXISTS public.validate_escola_saesc() CASCADE;

-- Função atualizada: permite POOL_REME ou escola válida
CREATE OR REPLACE FUNCTION public.validate_escola_saesc()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir POOL_REME (identificador especial)
  IF NEW.escola_saesc = 'POOL_REME' THEN
    RETURN NEW;
  END IF;
  
  -- Para outras escolas, validar que existe
  IF NOT EXISTS (
    SELECT 1 FROM escolas WHERE codigo_saesc = NEW.escola_saesc
  ) THEN
    RAISE EXCEPTION 'Escola com codigo_saesc % não existe', NEW.escola_saesc;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger
CREATE TRIGGER validate_escola_saesc_trigger
  BEFORE INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_escola_saesc();

-- Comentário explicativo
COMMENT ON FUNCTION public.validate_escola_saesc() IS 
'Valida escola_saesc: permite POOL_REME (pool de professores REME) ou códigos de escolas existentes';