-- Add codigo_saesc column to escolas table
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS codigo_saesc text;

-- Create unique index on codigo_saesc
CREATE UNIQUE INDEX IF NOT EXISTS idx_escolas_codigo_saesc_unique 
ON public.escolas (codigo_saesc) 
WHERE codigo_saesc IS NOT NULL;

-- Add RLS policy for admins to insert turmas
CREATE POLICY "Admins podem inserir turmas" 
ON public.turmas 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));