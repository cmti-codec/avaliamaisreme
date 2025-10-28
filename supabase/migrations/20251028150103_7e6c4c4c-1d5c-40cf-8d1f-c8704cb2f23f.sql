-- Adicionar política RLS de DELETE para componentes_curriculares
CREATE POLICY "Admin deleta componentes"
ON componentes_curriculares
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));