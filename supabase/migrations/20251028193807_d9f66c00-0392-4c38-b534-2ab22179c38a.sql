-- Permitir ADMIN ver todas as turmas
CREATE POLICY "Admin vê todas turmas"
ON public.turmas FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));