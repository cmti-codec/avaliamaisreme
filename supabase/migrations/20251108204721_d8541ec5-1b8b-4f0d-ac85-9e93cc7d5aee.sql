-- Create sanitization function for audit logs
CREATE OR REPLACE FUNCTION public.sanitize_audit_data(data jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT data - 'senha' - 'password' - 'token' - 'api_key' - 'secret' - 'impersonated_by' - 'auth_token'
$$;

-- Update audit_horarios trigger to use sanitization
DROP TRIGGER IF EXISTS audit_horarios_trigger ON public.horarios;

CREATE OR REPLACE FUNCTION public.audit_horarios()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_novos)
    VALUES (auth.uid(), 'INSERT', 'horarios', NEW.id, sanitize_audit_data(row_to_json(NEW)::jsonb));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
    VALUES (auth.uid(), 'UPDATE', 'horarios', NEW.id, sanitize_audit_data(row_to_json(OLD)::jsonb), sanitize_audit_data(row_to_json(NEW)::jsonb));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (usuario_id, acao, entidade, entidade_id, dados_anteriores)
    VALUES (auth.uid(), 'DELETE', 'horarios', OLD.id, sanitize_audit_data(row_to_json(OLD)::jsonb));
    RETURN OLD;
  END IF;
END;
$function$;

CREATE TRIGGER audit_horarios_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.horarios
FOR EACH ROW
EXECUTE FUNCTION public.audit_horarios();

-- Restrict audit_logs access to ADMIN and GESTOR_SEMED only
DROP POLICY IF EXISTS "Admin gestores veem logs" ON public.audit_logs;

CREATE POLICY "Admin gestores veem logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR 
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role)
);

-- Create rate_limits table for edge function rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 minute')
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can manage rate limits
CREATE POLICY "Service role manages rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_expires ON public.rate_limits(key, expires_at);

-- Auto-cleanup expired rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE expires_at < now();
END;
$$;