-- Adicionar opção MISTO ao tipo_jornada em matrizes_curriculares
-- Caso exista uma constraint, vamos removê-la e adicionar uma nova que inclui MISTO

-- Remove a constraint existente se houver
ALTER TABLE public.matrizes_curriculares 
DROP CONSTRAINT IF EXISTS matrizes_curriculares_tipo_jornada_check;

-- Adiciona nova constraint incluindo MISTO
ALTER TABLE public.matrizes_curriculares 
ADD CONSTRAINT matrizes_curriculares_tipo_jornada_check 
CHECK (tipo_jornada IN ('PARCIAL', 'INTEGRAL', 'MISTO'));