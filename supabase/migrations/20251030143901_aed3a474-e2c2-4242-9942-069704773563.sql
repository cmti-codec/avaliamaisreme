-- Atualizar tabela professores
ALTER TABLE professores 
  ADD COLUMN IF NOT EXISTS funcao_atual TEXT CHECK (funcao_atual IN ('PROFESSOR', 'DIRETOR', 'COORDENADOR', 'READAPTADO'));

-- Adicionar constraint de carga máxima (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_carga_max'
  ) THEN
    ALTER TABLE professores ADD CONSTRAINT check_carga_max CHECK (carga_horaria_contratual <= 50);
  END IF;
END $$;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_professores_ativo ON professores(ativo);
CREATE INDEX IF NOT EXISTS idx_professores_usuario ON professores(usuario_id);
CREATE INDEX IF NOT EXISTS idx_professores_funcao ON professores(funcao_atual);

-- Criar tabela de lotações
CREATE TABLE IF NOT EXISTS public.lotacoes_professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES public.professores(id) ON DELETE CASCADE,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  ano_letivo TEXT NOT NULL,
  horas_aula INTEGER CHECK (horas_aula >= 0 AND horas_aula <= 33),
  pl INTEGER CHECK (pl >= 0 AND pl <= 17),
  carga_total INTEGER GENERATED ALWAYS AS (horas_aula + pl) STORED,
  status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professor_id, escola_id, ano_letivo)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lotacoes_professor ON lotacoes_professores(professor_id);
CREATE INDEX IF NOT EXISTS idx_lotacoes_escola_ano ON lotacoes_professores(escola_id, ano_letivo);
CREATE INDEX IF NOT EXISTS idx_lotacoes_status ON lotacoes_professores(status);

-- Trigger: Validar carga total na REDE (limite 50h)
CREATE OR REPLACE FUNCTION check_carga_total_rede()
RETURNS TRIGGER AS $$
DECLARE
  total_rede INTEGER;
BEGIN
  SELECT COALESCE(SUM(carga_total), 0) INTO total_rede
  FROM lotacoes_professores
  WHERE professor_id = NEW.professor_id
    AND ano_letivo = NEW.ano_letivo
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF (total_rede + COALESCE(NEW.horas_aula, 0) + COALESCE(NEW.pl, 0)) > 50 THEN
    RAISE EXCEPTION 'Carga total do professor na rede (% + % = %) excede o limite de 50h', 
      total_rede, NEW.horas_aula + NEW.pl, total_rede + NEW.horas_aula + NEW.pl;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS validate_carga_rede ON lotacoes_professores;
CREATE TRIGGER validate_carga_rede
  BEFORE INSERT OR UPDATE ON lotacoes_professores
  FOR EACH ROW EXECUTE FUNCTION check_carga_total_rede();

-- Trigger: Atualizar updated_at
DROP TRIGGER IF EXISTS update_lotacoes_updated_at ON lotacoes_professores;
CREATE TRIGGER update_lotacoes_updated_at
  BEFORE UPDATE ON lotacoes_professores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE lotacoes_professores ENABLE ROW LEVEL SECURITY;

-- Admin: Acesso total
DROP POLICY IF EXISTS "Admin vê todas lotações" ON lotacoes_professores;
CREATE POLICY "Admin vê todas lotações"
  ON lotacoes_professores FOR SELECT
  USING (has_role(auth.uid(), 'ADMIN'));

DROP POLICY IF EXISTS "Admin gerencia lotações" ON lotacoes_professores;
CREATE POLICY "Admin gerencia lotações"
  ON lotacoes_professores FOR ALL
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- Gestão Escolar: Acesso à sua escola (SEM professor)
DROP POLICY IF EXISTS "Escola vê suas lotações" ON lotacoes_professores;
CREATE POLICY "Escola vê suas lotações"
  ON lotacoes_professores FOR SELECT
  USING (
    escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())
    AND (
      has_role(auth.uid(), 'DIRETOR') OR 
      has_role(auth.uid(), 'SECRETARIO') OR 
      has_role(auth.uid(), 'COORDENADOR')
    )
  );

DROP POLICY IF EXISTS "Escola gerencia suas lotações" ON lotacoes_professores;
CREATE POLICY "Escola gerencia suas lotações"
  ON lotacoes_professores FOR ALL
  USING (
    escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())
    AND (
      has_role(auth.uid(), 'DIRETOR') OR 
      has_role(auth.uid(), 'SECRETARIO') OR 
      has_role(auth.uid(), 'COORDENADOR')
    )
  )
  WITH CHECK (
    escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())
    AND (
      has_role(auth.uid(), 'DIRETOR') OR 
      has_role(auth.uid(), 'SECRETARIO') OR 
      has_role(auth.uid(), 'COORDENADOR')
    )
  );