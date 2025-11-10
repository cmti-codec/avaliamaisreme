-- ==========================================
-- FASE 2: Completar migração de lotações de professores
-- ==========================================

-- PASSO 1: Adicionar campos específicos de professores na tabela lotacoes
ALTER TABLE lotacoes ADD COLUMN IF NOT EXISTS ano_letivo TEXT;
ALTER TABLE lotacoes ADD COLUMN IF NOT EXISTS horas_aula INTEGER;
ALTER TABLE lotacoes ADD COLUMN IF NOT EXISTS pl INTEGER;
ALTER TABLE lotacoes ADD COLUMN IF NOT EXISTS carga_total INTEGER GENERATED ALWAYS AS (COALESCE(horas_aula, 0) + COALESCE(pl, 0)) STORED;
ALTER TABLE lotacoes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';

-- PASSO 2: Atualizar lotações de professores já migradas com dados completos
UPDATE lotacoes l
SET 
  ano_letivo = lp.ano_letivo,
  horas_aula = lp.horas_aula,
  pl = lp.pl,
  status = lp.status,
  updated_at = now()
FROM lotacoes_professores lp
JOIN professores p ON lp.professor_id = p.id
JOIN usuarios u ON p.usuario_id = u.id
JOIN escolas e ON lp.escola_id = e.id
WHERE l.pessoa_id = u.pessoa_id
  AND l.escola_saesc = e.saesc::text
  AND l.perfil = 'PROFESSOR'
  AND l.observacoes LIKE '%Migrado%';

-- PASSO 3: Inserir lotações de professores que não foram migradas ainda
INSERT INTO lotacoes (
  id, pessoa_id, escola_saesc, perfil, carga_horaria,
  ano_letivo, horas_aula, pl, status,
  data_inicio, data_fim, ativo, observacoes, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  u.pessoa_id,
  e.saesc::text,
  'PROFESSOR',
  lp.carga_total,
  lp.ano_letivo,
  lp.horas_aula,
  lp.pl,
  lp.status,
  lp.created_at::date,
  CASE WHEN lp.status != 'ATIVO' THEN lp.updated_at::date ELSE NULL END,
  CASE WHEN lp.status = 'ATIVO' THEN true ELSE false END,
  'Migrado de lotacoes_professores (fase 2)',
  lp.created_at,
  lp.updated_at
FROM lotacoes_professores lp
JOIN professores p ON lp.professor_id = p.id
JOIN usuarios u ON p.usuario_id = u.id
JOIN escolas e ON lp.escola_id = e.id
WHERE u.pessoa_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lotacoes l 
    WHERE l.pessoa_id = u.pessoa_id 
      AND l.escola_saesc = e.saesc::text 
      AND l.perfil = 'PROFESSOR'
      AND l.ano_letivo = lp.ano_letivo
  );

-- PASSO 4: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_lotacoes_ano_letivo ON lotacoes(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_lotacoes_perfil_ano ON lotacoes(perfil, ano_letivo);
CREATE INDEX IF NOT EXISTS idx_lotacoes_status ON lotacoes(status);

-- PASSO 5: Validação final
DO $$
DECLARE
  total_lotacoes_prof INTEGER;
  total_migradas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lotacoes_prof FROM lotacoes_professores;
  SELECT COUNT(*) INTO total_migradas FROM lotacoes WHERE perfil = 'PROFESSOR';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FASE 2 CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Lotações professores originais: %', total_lotacoes_prof;
  RAISE NOTICE 'Lotações professores migradas: %', total_migradas;
  RAISE NOTICE '========================================';
END $$;