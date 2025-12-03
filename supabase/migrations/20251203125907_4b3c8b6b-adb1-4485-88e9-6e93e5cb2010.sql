-- Remover política RESTRICTIVE atual
DROP POLICY IF EXISTS "Admin gerencia pessoas" ON public.pessoas;

-- Criar nova política PERMISSIVE (padrão) para ADMIN
CREATE POLICY "Admin gerencia pessoas" 
ON public.pessoas
FOR ALL
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));