-- Limpar professores duplicados mantendo apenas o registro correto

-- 1. Identificar duplicatas por nome (case insensitive)
WITH duplicatas AS (
  SELECT 
    LOWER(TRIM(nome)) as nome_normalizado,
    COUNT(*) as total,
    ARRAY_AGG(id ORDER BY 
      -- Prioridade: ativo > vinculado a usuário > tem lotações > mais recente
      CASE WHEN ativo THEN 1 ELSE 2 END,
      CASE WHEN usuario_id IS NOT NULL THEN 1 ELSE 2 END,
      created_at DESC
    ) as ids
  FROM professores
  GROUP BY LOWER(TRIM(nome))
  HAVING COUNT(*) > 1
),
registros_para_manter AS (
  SELECT 
    nome_normalizado,
    ids[1] as id_manter,
    ids[2:] as ids_remover
  FROM duplicatas
)
-- 2. Migrar lotações dos registros duplicados para o registro correto
UPDATE lotacoes_professores
SET professor_id = rpm.id_manter
FROM registros_para_manter rpm,
     UNNEST(rpm.ids_remover) as id_remover
WHERE professor_id = id_remover;

-- 3. Deletar registros duplicados
WITH duplicatas AS (
  SELECT 
    LOWER(TRIM(nome)) as nome_normalizado,
    ARRAY_AGG(id ORDER BY 
      CASE WHEN ativo THEN 1 ELSE 2 END,
      CASE WHEN usuario_id IS NOT NULL THEN 1 ELSE 2 END,
      created_at DESC
    ) as ids
  FROM professores
  GROUP BY LOWER(TRIM(nome))
  HAVING COUNT(*) > 1
)
DELETE FROM professores
WHERE id IN (
  SELECT UNNEST(ids[2:])
  FROM duplicatas
);

-- 4. Adicionar constraint para prevenir duplicatas futuras (por CPF quando preenchido)
CREATE UNIQUE INDEX IF NOT EXISTS professores_cpf_unique 
ON professores(cpf) 
WHERE cpf IS NOT NULL AND cpf != '';