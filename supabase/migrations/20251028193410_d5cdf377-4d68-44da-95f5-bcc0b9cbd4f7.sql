-- Permitir ADMIN atualizar turmas
CREATE POLICY "Admin atualiza turmas"
ON public.turmas FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- Permitir gestores da escola atualizar turmas da sua escola
CREATE POLICY "Gestores atualizam turmas da escola"
ON public.turmas FOR UPDATE
TO authenticated
USING (
  escola_id IN (
    SELECT escola_id FROM public.usuarios WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'DIRETOR'::app_role)
    OR has_role(auth.uid(), 'SECRETARIO'::app_role)
    OR has_role(auth.uid(), 'COORDENADOR'::app_role)
  )
)
WITH CHECK (
  escola_id IN (
    SELECT escola_id FROM public.usuarios WHERE id = auth.uid()
  )
  AND (
    has_role(auth.uid(), 'DIRETOR'::app_role)
    OR has_role(auth.uid(), 'SECRETARIO'::app_role)
    OR has_role(auth.uid(), 'COORDENADOR'::app_role)
  )
);

-- Permitir ADMIN deletar turmas
CREATE POLICY "Admin deleta turmas"
ON public.turmas FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'ADMIN'::app_role));