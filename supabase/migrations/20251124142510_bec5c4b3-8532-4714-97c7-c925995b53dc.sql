-- Corrigir trigger validate_escola_saesc para validar UUID da escola
CREATE OR REPLACE FUNCTION public.validate_escola_saesc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Permitir POOL_REME (identificador especial)
  IF NEW.escola_saesc = 'POOL_REME' THEN
    RETURN NEW;
  END IF;
  
  -- Para outras escolas, validar que existe usando o UUID (id)
  IF NOT EXISTS (
    SELECT 1 FROM escolas WHERE id::text = NEW.escola_saesc
  ) THEN
    RAISE EXCEPTION 'Escola com id % não existe', NEW.escola_saesc;
  END IF;
  
  RETURN NEW;
END;
$function$;