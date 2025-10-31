-- Atualizar função get_effective_user_id para ser determinística
-- Ordena por created_at DESC e limita a 1 para evitar ambiguidade
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT id FROM usuarios WHERE impersonated_by = auth.uid() ORDER BY created_at DESC LIMIT 1),
    auth.uid()
  )
$$;