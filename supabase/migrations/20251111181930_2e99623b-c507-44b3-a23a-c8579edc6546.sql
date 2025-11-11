-- Corrigir search_path da função validate_escola_saesc

DROP FUNCTION IF EXISTS public.validate_escola_saesc() CASCADE;

CREATE OR REPLACE FUNCTION public.validate_escola_saesc()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

-- Recriar trigger
DROP TRIGGER IF EXISTS validate_escola_saesc_trigger ON public.lotacoes;
CREATE TRIGGER validate_escola_saesc_trigger
  BEFORE INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_escola_saesc();

COMMENT ON FUNCTION public.validate_escola_saesc() IS 
'Valida escola_saesc: permite POOL_REME (pool de professores REME) ou códigos de escolas existentes';