-- Criar tabela de matrizes curriculares
CREATE TABLE IF NOT EXISTS public.matrizes_curriculares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  etapa_modalidade TEXT NOT NULL,
  grupo_ano TEXT NOT NULL,
  tipo_jornada TEXT CHECK (tipo_jornada IN ('PARCIAL', 'INTEGRAL')),
  total_horas_semanais INTEGER,
  descricao TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para busca por etapa e ano
CREATE INDEX IF NOT EXISTS idx_matrizes_etapa_ano ON public.matrizes_curriculares(etapa_modalidade, grupo_ano);

-- Criar tabela de componentes da matriz
CREATE TABLE IF NOT EXISTS public.matriz_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matriz_id UUID NOT NULL REFERENCES public.matrizes_curriculares(id) ON DELETE CASCADE,
  componente_nome TEXT NOT NULL REFERENCES public.componentes_curriculares(nome),
  carga_horaria_semanal INTEGER NOT NULL CHECK (carga_horaria_semanal > 0),
  ordem INTEGER DEFAULT 0,
  UNIQUE (matriz_id, componente_nome)
);

-- Criar índice para busca por matriz
CREATE INDEX IF NOT EXISTS idx_matriz_comp_matriz ON public.matriz_componentes(matriz_id);

-- Adicionar coluna matriz_curricular_id na tabela escolas
ALTER TABLE public.escolas 
ADD COLUMN IF NOT EXISTS matriz_curricular_id UUID REFERENCES public.matrizes_curriculares(id);

-- Criar VIEW auxiliar para turmas com matriz
CREATE OR REPLACE VIEW public.turmas_com_matriz AS
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

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.matrizes_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriz_componentes ENABLE ROW LEVEL SECURITY;

-- Políticas para matrizes_curriculares
-- Todos podem ver matrizes
CREATE POLICY "Todos podem ver matrizes" 
ON public.matrizes_curriculares
FOR SELECT
USING (true);

-- Apenas admin pode inserir matrizes
CREATE POLICY "Admin pode inserir matrizes" 
ON public.matrizes_curriculares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Apenas admin pode atualizar matrizes
CREATE POLICY "Admin pode atualizar matrizes" 
ON public.matrizes_curriculares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Apenas admin pode deletar matrizes
CREATE POLICY "Admin pode deletar matrizes" 
ON public.matrizes_curriculares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Políticas para matriz_componentes
-- Todos podem ver componentes da matriz
CREATE POLICY "Todos podem ver matriz_componentes" 
ON public.matriz_componentes
FOR SELECT
USING (true);

-- Apenas admin pode inserir componentes
CREATE POLICY "Admin pode inserir matriz_componentes" 
ON public.matriz_componentes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Apenas admin pode atualizar componentes
CREATE POLICY "Admin pode atualizar matriz_componentes" 
ON public.matriz_componentes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Apenas admin pode deletar componentes
CREATE POLICY "Admin pode deletar matriz_componentes" 
ON public.matriz_componentes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND perfil = 'admin'
  )
);

-- Trigger para atualizar updated_at em matrizes_curriculares
CREATE TRIGGER update_matrizes_curriculares_updated_at
BEFORE UPDATE ON public.matrizes_curriculares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();