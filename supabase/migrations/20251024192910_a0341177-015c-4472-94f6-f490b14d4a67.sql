-- Recriar VIEW turmas_com_matriz com SECURITY INVOKER para respeitar RLS
CREATE OR REPLACE VIEW public.turmas_com_matriz 
WITH (security_invoker=on) AS
SELECT 
  t.id as turma_id,
  t.escola_id as saesc,
  t.segmento as etapa_modalidade,
  t.grupo_ano,
  t.turma,
  t.turno,
  e.nome as nome_escola,
  m.id as matriz_id,
  m.codigo as matriz_codigo,
  m.nome as matriz_nome,
  m.total_horas_semanais,
  jsonb_object_agg(
    mc.componente_nome, 
    jsonb_build_object(
      'carga', mc.carga_horaria_semanal,
      'ordem', mc.ordem
    )
  ) FILTER (WHERE mc.componente_nome IS NOT NULL) as componentes
FROM public.turmas t
JOIN public.escolas e ON t.escola_id = e.id
LEFT JOIN public.matrizes_curriculares m ON e.matriz_curricular_id = m.id
LEFT JOIN public.matriz_componentes mc ON m.id = mc.matriz_id
WHERE t.ativa = true
GROUP BY 
  t.id, t.escola_id, t.segmento, t.grupo_ano, 
  t.turma, t.turno, e.nome, m.id, m.codigo, m.nome, m.total_horas_semanais;