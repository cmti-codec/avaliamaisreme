-- Fix SECURITY DEFINER views by enabling security_invoker
-- This ensures views respect the querying user's RLS policies

-- Fix usuarios_completos view
ALTER VIEW public.usuarios_completos SET (security_invoker = true);

-- Fix usuarios_contextualizados view  
ALTER VIEW public.usuarios_contextualizados SET (security_invoker = true);

-- Add comment explaining the security model
COMMENT ON VIEW public.usuarios_completos IS 'View runs with SECURITY INVOKER - respects querying user RLS policies';
COMMENT ON VIEW public.usuarios_contextualizados IS 'View runs with SECURITY INVOKER - respects querying user RLS policies';