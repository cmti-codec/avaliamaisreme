-- ==========================================
-- FASE 1: MIGRAÇÃO DE DADOS
-- Backup + Validação + Migração
-- ==========================================

-- PASSO 1: CRIAR TABELAS DE BACKUP
-- ==========================================
CREATE TABLE IF NOT EXISTS professores_backup AS SELECT * FROM professores;
CREATE TABLE IF NOT EXISTS lotacoes_professores_backup AS SELECT * FROM lotacoes_professores;
CREATE TABLE IF NOT EXISTS usuarios_backup AS SELECT * FROM usuarios;

-- PASSO 2: VALIDAÇÕES PRÉ-MIGRAÇÃO
-- ==========================================

-- Verificar quantos usuários não têm pessoa_id
DO $$
DECLARE
  usuarios_sem_pessoa INTEGER;
BEGIN
  SELECT COUNT(*) INTO usuarios_sem_pessoa 
  FROM usuarios 
  WHERE pessoa_id IS NULL;
  
  RAISE NOTICE 'Usuários sem pessoa_id: %', usuarios_sem_pessoa;
END $$;

-- PASSO 3: MIGRAR USUÁRIOS PARA PESSOAS
-- ==========================================

-- 3.1. Criar pessoas para usuários que ainda não têm
INSERT INTO pessoas (id, cpf, nome_completo, email, telefone, ativo, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  COALESCE(p.cpf, 'TEMP_' || SUBSTRING(u.id::text, 1, 8)),
  u.nome,
  u.email,
  p.telefone,
  u.ativo,
  u.created_at,
  now()
FROM usuarios u
LEFT JOIN professores p ON u.id = p.usuario_id
WHERE u.pessoa_id IS NULL
ON CONFLICT (cpf) DO NOTHING;

-- 3.2. Atualizar usuarios.pessoa_id
UPDATE usuarios u
SET pessoa_id = (
  SELECT pe.id 
  FROM pessoas pe 
  WHERE pe.email = u.email 
  LIMIT 1
)
WHERE u.pessoa_id IS NULL;

-- Validar: todos usuários devem ter pessoa_id agora
DO $$
DECLARE
  usuarios_sem_pessoa INTEGER;
BEGIN
  SELECT COUNT(*) INTO usuarios_sem_pessoa 
  FROM usuarios 
  WHERE pessoa_id IS NULL;
  
  IF usuarios_sem_pessoa > 0 THEN
    RAISE EXCEPTION 'ERRO: % usuários ainda sem pessoa_id após migração', usuarios_sem_pessoa;
  END IF;
  
  RAISE NOTICE '✅ Todos usuários têm pessoa_id';
END $$;

-- PASSO 4: MIGRAR LOTAÇÕES DE PROFESSORES
-- ==========================================

-- 4.1. Migrar lotacoes_professores → lotacoes
INSERT INTO lotacoes (id, pessoa_id, escola_saesc, perfil, carga_horaria, data_inicio, data_fim, ativo, observacoes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.pessoa_id,
  e.saesc::text,
  'PROFESSOR',
  lp.carga_total,
  lp.created_at::date,
  CASE WHEN lp.status != 'ATIVO' THEN lp.updated_at::date ELSE NULL END,
  CASE WHEN lp.status = 'ATIVO' THEN true ELSE false END,
  'Migrado de lotacoes_professores',
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
  );

-- Validar migração de professores
DO $$
DECLARE
  lotacoes_antigas INTEGER;
  lotacoes_novas INTEGER;
BEGIN
  SELECT COUNT(*) INTO lotacoes_antigas FROM lotacoes_professores;
  SELECT COUNT(*) INTO lotacoes_novas FROM lotacoes WHERE perfil = 'PROFESSOR' AND observacoes LIKE '%Migrado%';
  
  RAISE NOTICE 'Lotações professores migradas: % de %', lotacoes_novas, lotacoes_antigas;
END $$;

-- PASSO 5: MIGRAR LOTAÇÕES DE GESTORES (DIRETOR/SECRETARIO/COORDENADOR)
-- ==========================================

-- 5.1. Criar lotações baseadas em user_roles + usuarios.escola_id (se existir)
INSERT INTO lotacoes (id, pessoa_id, escola_saesc, perfil, carga_horaria, data_inicio, ativo, observacoes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.pessoa_id,
  e.saesc::text,
  ur.role::text,
  CASE 
    WHEN ur.role = 'COORDENADOR' THEN 40
    ELSE NULL 
  END,
  u.created_at::date,
  u.ativo,
  'Migrado de user_roles + escola_id',
  u.created_at,
  now()
FROM user_roles ur
JOIN usuarios u ON ur.user_id = u.id
LEFT JOIN escolas e ON ur.escola_id = e.id
WHERE ur.role IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR')
  AND u.pessoa_id IS NOT NULL
  AND e.saesc IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM lotacoes l 
    WHERE l.pessoa_id = u.pessoa_id 
      AND l.escola_saesc = e.saesc::text 
      AND l.perfil = ur.role::text
  );

-- Validar migração de gestores
DO $$
DECLARE
  gestores_migrados INTEGER;
BEGIN
  SELECT COUNT(*) INTO gestores_migrados 
  FROM lotacoes 
  WHERE perfil IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR') 
    AND observacoes LIKE '%Migrado%';
  
  RAISE NOTICE 'Lotações gestores migradas: %', gestores_migrados;
END $$;

-- PASSO 6: CRIAR ÍNDICES PARA PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_pessoas_cpf ON pessoas(cpf);
CREATE INDEX IF NOT EXISTS idx_pessoas_email ON pessoas(email);
CREATE INDEX IF NOT EXISTS idx_lotacoes_pessoa_id ON lotacoes(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_lotacoes_escola_saesc ON lotacoes(escola_saesc);
CREATE INDEX IF NOT EXISTS idx_lotacoes_perfil ON lotacoes(perfil);
CREATE INDEX IF NOT EXISTS idx_lotacoes_ativo ON lotacoes(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_pessoa_id ON usuarios(pessoa_id);

-- PASSO 7: RENOMEAR TABELAS ANTIGAS (DEPRECAR)
-- ==========================================

-- Renomear professores → professores_deprecated
ALTER TABLE IF EXISTS professores RENAME TO professores_deprecated;

-- Renomear lotacoes_professores → lotacoes_professores_deprecated
ALTER TABLE IF EXISTS lotacoes_professores RENAME TO lotacoes_professores_deprecated;

-- PASSO 8: VALIDAÇÃO FINAL
-- ==========================================

DO $$
DECLARE
  total_usuarios INTEGER;
  usuarios_com_pessoa INTEGER;
  total_lotacoes INTEGER;
  lotacoes_ativas INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_usuarios FROM usuarios;
  SELECT COUNT(*) INTO usuarios_com_pessoa FROM usuarios WHERE pessoa_id IS NOT NULL;
  SELECT COUNT(*) INTO total_lotacoes FROM lotacoes;
  SELECT COUNT(*) INTO lotacoes_ativas FROM lotacoes WHERE ativo = true;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de usuários: %', total_usuarios;
  RAISE NOTICE 'Usuários com pessoa_id: %', usuarios_com_pessoa;
  RAISE NOTICE 'Total de lotações: %', total_lotacoes;
  RAISE NOTICE 'Lotações ativas: %', lotacoes_ativas;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabelas de backup criadas:';
  RAISE NOTICE '  - professores_backup';
  RAISE NOTICE '  - lotacoes_professores_backup';
  RAISE NOTICE '  - usuarios_backup';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tabelas depreciadas:';
  RAISE NOTICE '  - professores_deprecated';
  RAISE NOTICE '  - lotacoes_professores_deprecated';
  RAISE NOTICE '========================================';
END $$;