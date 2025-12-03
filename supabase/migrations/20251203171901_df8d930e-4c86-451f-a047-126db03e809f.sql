-- Corrigir função get_user_escolas_ids para filtrar valores inválidos antes do cast
CREATE OR REPLACE FUNCTION public.get_user_escolas_ids(_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(escola_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT escola_saesc::uuid
  FROM public.lotacoes
  WHERE pessoa_id = (
    SELECT pessoa_id 
    FROM public.usuarios 
    WHERE id = COALESCE(_user_id, get_effective_user_id())
  )
  AND ativo = true
  AND escola_saesc IS NOT NULL
  AND escola_saesc != ''
  AND escola_saesc ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$$;

-- Recriar policy "Diretores veem lotacoes da escola" com validação prévia
DROP POLICY IF EXISTS "Diretores veem lotacoes da escola" ON public.lotacoes;

CREATE POLICY "Diretores veem lotacoes da escola"
ON public.lotacoes FOR SELECT
TO authenticated
USING (
  has_role(get_effective_user_id(), 'DIRETOR'::app_role) 
  AND escola_saesc IS NOT NULL 
  AND escola_saesc != ''
  AND escola_saesc ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND (escola_saesc)::uuid IN (
    SELECT escola_id FROM get_user_escolas_ids(get_effective_user_id())
  )
);