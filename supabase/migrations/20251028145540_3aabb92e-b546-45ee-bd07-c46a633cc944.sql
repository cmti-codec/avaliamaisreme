-- Adicionar política RLS de UPDATE para componentes_curriculares
CREATE POLICY "Admin atualiza componentes"
ON componentes_curriculares
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));