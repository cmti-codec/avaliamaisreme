-- FASE 1 e 2: Correções Críticas de Arquitetura

-- 1.1 Dropar políticas que dependem de usuarios.escola_id
DROP POLICY IF EXISTS "Usuários veem eventos de professores da sua escola" ON professor_eventos;
DROP POLICY IF EXISTS "Usuários veem alunos da sua escola" ON alunos;
DROP POLICY IF EXISTS "Escolares veem matrizes da escola" ON escola_matrizes;
DROP POLICY IF EXISTS "Usuários veem horários de turmas da sua escola" ON horarios;
DROP POLICY IF EXISTS "Escola gerencia suas lotações" ON lotacoes_professores;
DROP POLICY IF EXISTS "Escola vê suas lotações" ON lotacoes_professores;
DROP POLICY IF EXISTS "Gestores escolares inserem professores" ON professores;
DROP POLICY IF EXISTS "Gestores escolares veem pool REME e sua escola" ON professores;
DROP POLICY IF EXISTS "Gestores atualizam turmas da escola" ON turmas;
DROP POLICY IF EXISTS "Usuários podem inserir turmas na sua escola" ON turmas;
DROP POLICY IF EXISTS "Usuários veem turmas da sua escola" ON turmas;
DROP POLICY IF EXISTS "Diretores veem lotacoes da escola" ON lotacoes;

-- 1.2 Dropar view que depende de usuarios.escola_id
DROP VIEW IF EXISTS usuarios_completos CASCADE;

-- 1.3 Remover campo usuarios.escola_id
ALTER TABLE usuarios DROP COLUMN IF EXISTS escola_id CASCADE;

-- 1.4 Recriar políticas usando lotacoes ao invés de usuarios.escola_id

-- Professor eventos: via lotacoes ativas
CREATE POLICY "Usuários veem eventos de professores da escola lotada" 
  ON professor_eventos FOR SELECT 
  USING (
    professor_id IN (
      SELECT p.id FROM professores p
      INNER JOIN lotacoes_professores lp ON lp.professor_id = p.id
      INNER JOIN lotacoes l ON l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
      WHERE lp.escola_id = (SELECT escola_saesc::uuid FROM lotacoes WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) AND ativo = true LIMIT 1)
    )
  );

-- Alunos: via lotacoes ativas
CREATE POLICY "Usuários veem alunos da escola lotada" 
  ON alunos FOR SELECT 
  USING (
    saesc IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
  );

-- Escola matrizes: via lotacoes ativas
CREATE POLICY "Escolares veem matrizes da escola lotada" 
  ON escola_matrizes FOR SELECT 
  USING (
    escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
    AND (
      has_role(get_effective_user_id(), 'DIRETOR') 
      OR has_role(get_effective_user_id(), 'SECRETARIO') 
      OR has_role(get_effective_user_id(), 'COORDENADOR') 
      OR has_role(get_effective_user_id(), 'PROFESSOR')
    )
  );

-- Horários: via lotacoes ativas
CREATE POLICY "Usuários veem horários da escola lotada" 
  ON horarios FOR SELECT 
  USING (
    turma_id IN (
      SELECT t.id FROM turmas t
      INNER JOIN lotacoes l ON l.escola_saesc::uuid = t.escola_id
      WHERE l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
        AND l.ativo = true
    )
  );

-- Professores: gestores escolares
CREATE POLICY "Gestores escolares inserem professores pool" 
  ON professores FOR INSERT 
  WITH CHECK (
    (has_role(get_effective_user_id(), 'DIRETOR') 
     OR has_role(get_effective_user_id(), 'SECRETARIO') 
     OR has_role(get_effective_user_id(), 'COORDENADOR'))
    AND (escola_id IS NULL OR escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    ))
  );

CREATE POLICY "Gestores escolares veem pool e escola lotada" 
  ON professores FOR SELECT 
  USING (
    (has_role(get_effective_user_id(), 'DIRETOR') 
     OR has_role(get_effective_user_id(), 'SECRETARIO') 
     OR has_role(get_effective_user_id(), 'COORDENADOR'))
    AND (escola_id IS NULL OR escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    ))
  );

-- Turmas: gestores escolares
CREATE POLICY "Gestores atualizam turmas da escola lotada" 
  ON turmas FOR UPDATE 
  USING (
    escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
    AND (has_role(get_effective_user_id(), 'DIRETOR') 
         OR has_role(get_effective_user_id(), 'SECRETARIO') 
         OR has_role(get_effective_user_id(), 'COORDENADOR'))
  )
  WITH CHECK (
    escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
    AND (has_role(get_effective_user_id(), 'DIRETOR') 
         OR has_role(get_effective_user_id(), 'SECRETARIO') 
         OR has_role(get_effective_user_id(), 'COORDENADOR'))
  );

CREATE POLICY "Usuários inserem turmas na escola lotada" 
  ON turmas FOR INSERT 
  WITH CHECK (
    escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
  );

CREATE POLICY "Usuários veem turmas da escola lotada" 
  ON turmas FOR SELECT 
  USING (
    escola_id IN (
      SELECT escola_saesc::uuid 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
  );

-- Lotacoes: diretores veem lotações da escola
CREATE POLICY "Diretores veem lotacoes da escola lotada" 
  ON lotacoes FOR SELECT 
  USING (
    has_role(get_effective_user_id(), 'DIRETOR') 
    AND escola_saesc IN (
      SELECT escola_saesc 
      FROM lotacoes 
      WHERE pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id()) 
        AND ativo = true
    )
  );

-- 1.5 Recriar view usuarios_completos sem escola_id
CREATE OR REPLACE VIEW usuarios_completos AS
SELECT 
  u.id,
  u.nome,
  u.email,
  u.ativo,
  u.created_at,
  u.impersonated_by,
  p.id as professor_id,
  p.matricula,
  p.cpf,
  p.telefone,
  p.cargo,
  p.funcao_atual,
  p.carga_horaria_contratual,
  p.horas_pl,
  p.formacoes,
  p.tipo_vinculo,
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object('role', ur.role, 'escola_id', ur.escola_id)
    ) FILTER (WHERE ur.role IS NOT NULL),
    '[]'::jsonb
  ) as roles
FROM usuarios u
LEFT JOIN professores p ON u.id = p.usuario_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.nome, u.email, u.ativo, u.created_at, u.impersonated_by, 
         p.id, p.matricula, p.cpf, p.telefone, p.cargo, p.funcao_atual, 
         p.carga_horaria_contratual, p.horas_pl, p.formacoes, p.tipo_vinculo;

-- 1.6 Deprecar lotacoes_professores
ALTER TABLE IF EXISTS lotacoes_professores 
  RENAME TO lotacoes_professores_deprecated;

-- Criar política para tabela deprecated
CREATE POLICY "Admin acessa deprecated lotacoes_professores" 
  ON lotacoes_professores_deprecated 
  FOR ALL 
  USING (has_role(get_effective_user_id(), 'ADMIN'));

COMMENT ON TABLE lotacoes_professores_deprecated IS 
  'DEPRECATED: Tabela antiga de lotações. Use a tabela lotacoes que é unificada para todos os perfis.';