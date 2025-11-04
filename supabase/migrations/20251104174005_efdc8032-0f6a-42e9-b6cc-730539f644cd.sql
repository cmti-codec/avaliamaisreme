-- 1) Fix get_effective_user_id to only consider impersonation for ADMIN users
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT u.id
      FROM public.usuarios u
      WHERE u.impersonated_by = auth.uid()
        AND public.has_role(auth.uid(), 'ADMIN'::app_role)
      ORDER BY u.created_at DESC
      LIMIT 1
    ),
    auth.uid()
  );
$$;

-- 2) Create RPC to clear pending impersonations safely
CREATE OR REPLACE FUNCTION public.clear_impersonations_for(_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH upd AS (
    UPDATE public.usuarios
    SET impersonated_by = NULL
    WHERE impersonated_by = _user_id
    RETURNING 1
  )
  SELECT COUNT(*) FROM upd;
$$;