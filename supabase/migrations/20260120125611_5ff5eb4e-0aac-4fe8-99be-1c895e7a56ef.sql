
-- 1. Recriar view usuarios_completos SEM security_invoker (usando security_invoker = true respeita RLS)
DROP VIEW IF EXISTS public.usuarios_completos;

CREATE VIEW public.usuarios_completos 
WITH (security_invoker = true)
AS
SELECT 
  u.id,
  u.nome,
  u.email,
  u.ativo,
  u.created_at,
  u.impersonated_by,
  p.id AS professor_id,
  p.matricula,
  p.cpf,
  p.telefone,
  p.cargo,
  p.funcao_atual,
  p.carga_horaria_contratual,
  p.horas_pl,
  p.formacoes,
  p.tipo_vinculo,
  COALESCE(jsonb_agg(DISTINCT jsonb_build_object('role', ur.role, 'escola_id', ur.escola_id)) FILTER (WHERE ur.role IS NOT NULL), '[]'::jsonb) AS roles
FROM usuarios u
LEFT JOIN professores p ON u.id = p.usuario_id
LEFT JOIN user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.nome, u.email, u.ativo, u.created_at, u.impersonated_by, 
         p.id, p.matricula, p.cpf, p.telefone, p.cargo, p.funcao_atual, 
         p.carga_horaria_contratual, p.horas_pl, p.formacoes, p.tipo_vinculo;

-- 2. Recriar view usuarios_contextualizados SEM security_invoker
DROP VIEW IF EXISTS public.usuarios_contextualizados;

CREATE VIEW public.usuarios_contextualizados
WITH (security_invoker = true)
AS
SELECT 
  u.id AS usuario_id,
  p.id AS pessoa_id,
  p.cpf,
  p.nome_completo,
  p.email,
  p.telefone,
  u.ativo AS usuario_ativo,
  COALESCE(json_agg(
    json_build_object(
      'id', l.id,
      'lotacao_id', l.id,
      'escola_saesc', l.escola_saesc,
      'escola_nome', e.nome,
      'perfil', l.perfil,
      'carga_horaria', l.carga_horaria,
      'data_inicio', l.data_inicio,
      'data_fim', l.data_fim
    ) ORDER BY l.data_inicio DESC
  ) FILTER (WHERE l.ativo = true AND e.id IS NOT NULL), '[]'::json) AS lotacoes_ativas,
  COUNT(l.id) FILTER (WHERE l.ativo = true AND e.id IS NOT NULL) AS total_lotacoes_ativas,
  SUM(l.carga_horaria) FILTER (WHERE l.ativo = true AND l.perfil = 'PROFESSOR' AND e.id IS NOT NULL) AS carga_horaria_total
FROM usuarios u
JOIN pessoas p ON u.pessoa_id = p.id
LEFT JOIN lotacoes l ON p.id = l.pessoa_id
LEFT JOIN escolas e ON l.escola_saesc = e.id::text
WHERE u.ativo = true
GROUP BY u.id, p.id, p.cpf, p.nome_completo, p.email, p.telefone, u.ativo;

-- 3. Recriar view turmas_com_matriz SEM security_invoker
DROP VIEW IF EXISTS public.turmas_com_matriz;

CREATE VIEW public.turmas_com_matriz
WITH (security_invoker = true)
AS
SELECT 
  t.id AS turma_id,
  t.escola_id AS saesc,
  t.etapa_modalidade,
  t.grupo_ano,
  t.turma,
  t.turno,
  e.nome AS nome_escola,
  m.id AS matriz_id,
  m.codigo AS matriz_codigo,
  m.nome AS matriz_nome,
  m.total_horas_semanais,
  jsonb_object_agg(
    mc.componente_nome, 
    jsonb_build_object('carga', mc.carga_horaria_semanal, 'ordem', mc.ordem)
  ) FILTER (WHERE mc.componente_nome IS NOT NULL) AS componentes
FROM turmas t
JOIN escolas e ON t.escola_id = e.id
LEFT JOIN matrizes_curriculares m ON e.matriz_curricular_id = m.id
LEFT JOIN matriz_componentes mc ON m.id = mc.matriz_id
WHERE t.ativa = true
GROUP BY t.id, t.escola_id, t.etapa_modalidade, t.grupo_ano, t.turma, t.turno, 
         e.nome, m.id, m.codigo, m.nome, m.total_horas_semanais;
