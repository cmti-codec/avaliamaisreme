-- Política para ADMIN inserir horários
CREATE POLICY "Admin insere horarios" ON public.horarios
FOR INSERT
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

-- Política para ADMIN atualizar horários
CREATE POLICY "Admin atualiza horarios" ON public.horarios
FOR UPDATE
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

-- Política para ADMIN deletar horários
CREATE POLICY "Admin deleta horarios" ON public.horarios
FOR DELETE
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

-- Política para gestores escolares inserirem horários da escola
CREATE POLICY "Gestores inserem horarios da escola" ON public.horarios
FOR INSERT
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR 
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR 
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND turma_id IN (
    SELECT t.id FROM turmas t
    JOIN lotacoes l ON (l.escola_saesc)::uuid = t.escola_id
    WHERE l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
    AND l.ativo = true
  )
);

-- Política para gestores escolares atualizarem horários da escola
CREATE POLICY "Gestores atualizam horarios da escola" ON public.horarios
FOR UPDATE
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR 
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR 
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND turma_id IN (
    SELECT t.id FROM turmas t
    JOIN lotacoes l ON (l.escola_saesc)::uuid = t.escola_id
    WHERE l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
    AND l.ativo = true
  )
)
WITH CHECK (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR 
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR 
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND turma_id IN (
    SELECT t.id FROM turmas t
    JOIN lotacoes l ON (l.escola_saesc)::uuid = t.escola_id
    WHERE l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
    AND l.ativo = true
  )
);

-- Política para gestores escolares deletarem horários da escola
CREATE POLICY "Gestores deletam horarios da escola" ON public.horarios
FOR DELETE
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR 
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR 
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND turma_id IN (
    SELECT t.id FROM turmas t
    JOIN lotacoes l ON (l.escola_saesc)::uuid = t.escola_id
    WHERE l.pessoa_id = (SELECT pessoa_id FROM usuarios WHERE id = get_effective_user_id())
    AND l.ativo = true
  )
);