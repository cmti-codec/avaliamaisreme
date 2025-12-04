-- Parte 1: Limpar sessões de impersonação órfãs
UPDATE public.impersonation_sessions 
SET ended_at = NOW() 
WHERE ended_at IS NULL;

-- Parte 2: Ajustar política RLS para permitir usuário ver próprio registro sempre
DROP POLICY IF EXISTS usuario_ve_proprio ON public.usuarios;

CREATE POLICY usuario_ve_proprio ON public.usuarios
  FOR SELECT
  USING (id = auth.uid() OR id = get_effective_user_id());