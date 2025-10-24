-- Adicionar campo para rastrear impersonação
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS impersonated_by UUID REFERENCES public.usuarios(id);

COMMENT ON COLUMN public.usuarios.impersonated_by IS 'ID do admin que está assumindo este perfil';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_impersonated_by 
ON public.usuarios(impersonated_by) 
WHERE impersonated_by IS NOT NULL;