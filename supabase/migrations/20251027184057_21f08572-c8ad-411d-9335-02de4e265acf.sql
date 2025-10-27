-- Adicionar coluna grupo_ano na tabela matriz_componentes
-- Isso permitirá que cada componente seja vinculado a um ano específico dentro da matriz

ALTER TABLE public.matriz_componentes 
ADD COLUMN grupo_ano text;

-- Migrar dados existentes: copiar o grupo_ano da matriz para todos os componentes
UPDATE public.matriz_componentes mc
SET grupo_ano = (
  SELECT grupo_ano 
  FROM public.matrizes_curriculares m 
  WHERE m.id = mc.matriz_id
);

-- Tornar a coluna obrigatória após migração
ALTER TABLE public.matriz_componentes 
ALTER COLUMN grupo_ano SET NOT NULL;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.matriz_componentes.grupo_ano IS 'Ano específico dentro da matriz (ex: 1º ANO, 2º ANO). Uma matriz pode ter múltiplos anos.';