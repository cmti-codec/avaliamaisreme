-- Adicionar tipo_vinculo à tabela professores
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_vinculo') THEN
    CREATE TYPE tipo_vinculo AS ENUM ('EFETIVO', 'CONVOCADO');
  END IF;
END $$;

ALTER TABLE professores 
ADD COLUMN IF NOT EXISTS tipo_vinculo tipo_vinculo DEFAULT 'EFETIVO';

-- Atualizar trigger para calcular carga_total automaticamente
CREATE OR REPLACE FUNCTION public.calcular_carga_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.carga_total := COALESCE(NEW.horas_aula, 0) + COALESCE(NEW.pl, 0);
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_calcular_carga_total ON lotacoes_professores;
CREATE TRIGGER trigger_calcular_carga_total
  BEFORE INSERT OR UPDATE ON lotacoes_professores
  FOR EACH ROW
  EXECUTE FUNCTION calcular_carga_total();

-- Melhorar função de validação de carga na rede
CREATE OR REPLACE FUNCTION public.check_carga_total_rede()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total_rede INTEGER;
  carga_contratual INTEGER;
  nova_carga INTEGER;
BEGIN
  -- Buscar carga contratual do professor
  SELECT COALESCE(carga_horaria_contratual, 40) INTO carga_contratual
  FROM professores
  WHERE id = NEW.professor_id;
  
  -- Calcular total já alocado na rede (excluindo a lotação atual se for UPDATE)
  SELECT COALESCE(SUM(carga_total), 0) INTO total_rede
  FROM lotacoes_professores
  WHERE professor_id = NEW.professor_id
    AND ano_letivo = NEW.ano_letivo
    AND status = 'ATIVO'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  -- Calcular nova carga que será adicionada
  nova_carga := COALESCE(NEW.horas_aula, 0) + COALESCE(NEW.pl, 0);
  
  -- Validar se não excede 50h na rede
  IF (total_rede + nova_carga) > 50 THEN
    RAISE EXCEPTION 'Carga total do professor na rede (% já alocadas + % nova = %h) excede o limite de 50h', 
      total_rede, nova_carga, total_rede + nova_carga;
  END IF;
  
  -- Avisar se excede carga contratual (apenas warning, não bloqueia)
  IF (total_rede + nova_carga) > carga_contratual THEN
    RAISE WARNING 'Carga total alocada (%h) excede a carga contratual do professor (%h)', 
      total_rede + nova_carga, carga_contratual;
  END IF;
  
  RETURN NEW;
END;
$function$;