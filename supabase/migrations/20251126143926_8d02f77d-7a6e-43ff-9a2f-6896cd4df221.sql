-- Atualizar a view usuarios_contextualizados para filtrar lotações com escolas inválidas

CREATE OR REPLACE VIEW usuarios_contextualizados AS
SELECT 
  u.id AS usuario_id,
  p.id AS pessoa_id,
  p.cpf,
  p.nome_completo,
  p.email,
  p.telefone,
  u.ativo AS usuario_ativo,
  COALESCE(
    json_agg(
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
    ) FILTER (WHERE l.ativo = true AND e.id IS NOT NULL), 
    '[]'::json
  ) AS lotacoes_ativas,
  count(l.id) FILTER (WHERE l.ativo = true AND e.id IS NOT NULL) AS total_lotacoes_ativas,
  sum(l.carga_horaria) FILTER (WHERE l.ativo = true AND l.perfil = 'PROFESSOR' AND e.id IS NOT NULL) AS carga_horaria_total
FROM usuarios u
JOIN pessoas p ON u.pessoa_id = p.id
LEFT JOIN lotacoes l ON p.id = l.pessoa_id
LEFT JOIN escolas e ON l.escola_saesc = e.id::text
WHERE u.ativo = true
GROUP BY u.id, p.id, p.cpf, p.nome_completo, p.email, p.telefone, u.ativo;