-- ==========================================
-- CORREÇÃO: Reverter renomeação e adicionar validação
-- ==========================================

-- PASSO 1: Reverter renomeação das tabelas
ALTER TABLE IF EXISTS professores_deprecated RENAME TO professores;
ALTER TABLE IF EXISTS lotacoes_professores_deprecated RENAME TO lotacoes_professores;

-- PASSO 2: Criar função auxiliar para validar escola
CREATE OR REPLACE FUNCTION validate_escola_saesc()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM escolas WHERE saesc::text = NEW.escola_saesc
  ) THEN
    RAISE EXCEPTION 'Escola com saesc % não existe', NEW.escola_saesc;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Criar trigger para validar escola_saesc
DROP TRIGGER IF EXISTS validate_lotacoes_escola ON lotacoes;
CREATE TRIGGER validate_lotacoes_escola
  BEFORE INSERT OR UPDATE ON lotacoes
  FOR EACH ROW
  EXECUTE FUNCTION validate_escola_saesc();

-- PASSO 4: Validação final
DO $$
BEGIN
  RAISE NOTICE '✅ Correção aplicada: tabelas revertidas e trigger de validação criado';
END $$;