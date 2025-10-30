-- Criar tabela de relacionamento many-to-many entre escolas e matrizes
CREATE TABLE IF NOT EXISTS public.escola_matrizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
  matriz_id UUID NOT NULL REFERENCES public.matrizes_curriculares(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(escola_id, matriz_id)
);

-- Adicionar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_escola_matrizes_escola_id ON public.escola_matrizes(escola_id);
CREATE INDEX IF NOT EXISTS idx_escola_matrizes_matriz_id ON public.escola_matrizes(matriz_id);

-- Migrar dados existentes da coluna matriz_curricular_id para a nova tabela
INSERT INTO public.escola_matrizes (escola_id, matriz_id)
SELECT id, matriz_curricular_id
FROM public.escolas
WHERE matriz_curricular_id IS NOT NULL
ON CONFLICT (escola_id, matriz_id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.escola_matrizes ENABLE ROW LEVEL SECURITY;

-- Política para admin e rede
CREATE POLICY "Admin rede veem escola_matrizes"
  ON public.escola_matrizes
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'GESTOR_SEMED'::app_role) OR 
    has_role(auth.uid(), 'TECNICO_SEMED'::app_role)
  );

CREATE POLICY "Admin rede gerenciam escola_matrizes"
  ON public.escola_matrizes
  FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'GESTOR_SEMED'::app_role) OR 
    has_role(auth.uid(), 'TECNICO_SEMED'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN'::app_role) OR 
    has_role(auth.uid(), 'GESTOR_SEMED'::app_role) OR 
    has_role(auth.uid(), 'TECNICO_SEMED'::app_role)
  );

-- Política para escolares verem suas matrizes
CREATE POLICY "Escolares veem matrizes da escola"
  ON public.escola_matrizes
  FOR SELECT
  USING (
    (escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())) AND
    (has_role(auth.uid(), 'DIRETOR'::app_role) OR 
     has_role(auth.uid(), 'SECRETARIO'::app_role) OR 
     has_role(auth.uid(), 'COORDENADOR'::app_role) OR 
     has_role(auth.uid(), 'PROFESSOR'::app_role))
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_escola_matrizes_updated_at
  BEFORE UPDATE ON public.escola_matrizes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();