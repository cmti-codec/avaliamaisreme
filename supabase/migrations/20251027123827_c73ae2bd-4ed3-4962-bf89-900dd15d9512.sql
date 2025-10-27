-- Drop da política incorreta que não tinha WITH CHECK
DROP POLICY IF EXISTS "Admin gerencia usuarios" ON public.usuarios;

-- Recriar política com USING e WITH CHECK para permitir INSERT
CREATE POLICY "Admin gerencia usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));