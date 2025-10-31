-- Remove a política antiga que não verifica roles
DROP POLICY IF EXISTS "Gestão vê pool REME e sua escola" ON public.professores;

-- Remove a política antiga de inserção
DROP POLICY IF EXISTS "Gestão insere professores" ON public.professores;

-- Cria nova política para SELECT com verificação de roles
CREATE POLICY "Gestores escolares veem pool REME e sua escola"
ON public.professores
FOR SELECT
TO authenticated
USING (
  (
    -- Verifica se o usuário tem role de gestão escolar
    has_role(auth.uid(), 'DIRETOR'::app_role) OR
    has_role(auth.uid(), 'SECRETARIO'::app_role) OR
    has_role(auth.uid(), 'COORDENADOR'::app_role)
  ) AND (
    -- Pool REME (escola_id IS NULL) ou professores da própria escola
    escola_id IS NULL OR 
    escola_id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = auth.uid()
    )
  )
);

-- Cria nova política para INSERT com verificação de roles
CREATE POLICY "Gestores escolares inserem professores"
ON public.professores
FOR INSERT
TO authenticated
WITH CHECK (
  (
    has_role(auth.uid(), 'DIRETOR'::app_role) OR
    has_role(auth.uid(), 'SECRETARIO'::app_role) OR
    has_role(auth.uid(), 'COORDENADOR'::app_role)
  ) AND (
    escola_id IS NULL OR 
    escola_id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = auth.uid()
    )
  )
);