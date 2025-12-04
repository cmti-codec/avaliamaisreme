
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (
      -- Verificar se há uma sessão de impersonação ativa
      SELECT s.target_user_id
      FROM public.impersonation_sessions s
      WHERE s.admin_user_id = auth.uid()
        AND s.ended_at IS NULL
        AND s.expires_at > now()
        AND public.has_role(auth.uid(), 'ADMIN'::app_role)
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    auth.uid()
  );
$function$;
