-- Fase 6: RLS para tabela pessoas

-- Política para Gestores SEMED verem todas as pessoas da rede
CREATE POLICY "Gestores SEMED veem todas pessoas"
ON public.pessoas
FOR SELECT
USING (
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

-- Política para Gestores Escolares verem pessoas da escola onde estão lotados
CREATE POLICY "Gestores escolares veem pessoas da escola lotada"
ON public.pessoas
FOR SELECT
USING (
  (has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
   has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
   has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
  AND
  id IN (
    SELECT DISTINCT l1.pessoa_id
    FROM lotacoes l1
    WHERE l1.escola_saesc IN (
      SELECT l2.escola_saesc
      FROM lotacoes l2
      WHERE l2.pessoa_id = (
        SELECT pessoa_id 
        FROM usuarios 
        WHERE id = get_effective_user_id()
      )
      AND l2.ativo = true
    )
    AND l1.ativo = true
  )
);