-- Correção 1: Atualizar política RLS da tabela professores
-- Remove a política problemática que causa recursão
DROP POLICY IF EXISTS "Gestores escolares veem pool e escola lotada" ON public.professores;

-- Cria nova política usando get_user_escolas_ids() que é SECURITY DEFINER
CREATE POLICY "Gestores escolares veem pool e escola lotada" 
  ON public.professores FOR SELECT 
  USING (
    (has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
     OR has_role(get_effective_user_id(), 'SECRETARIO'::app_role) 
     OR has_role(get_effective_user_id(), 'COORDENADOR'::app_role))
    AND (
      escola_id IS NULL  -- Pool REME (professores sem escola definida)
      OR escola_id IN (
        SELECT escola_id FROM public.get_user_escolas_ids(get_effective_user_id())
      )
    )
  );