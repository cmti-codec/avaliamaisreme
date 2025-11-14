-- Criar tabela de sessões de impersonação/teste
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de auditoria de impersonação
CREATE TABLE IF NOT EXISTS public.audit_impersonation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('START', 'END')),
  session_token TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_impersonation ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas ADMINs podem acessar essas tabelas
CREATE POLICY "Apenas admins gerenciam sessões"
  ON public.impersonation_sessions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Apenas admins veem auditoria"
  ON public.audit_impersonation
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'ADMIN'::app_role));

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_token 
  ON public.impersonation_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin 
  ON public.impersonation_sessions(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_target 
  ON public.impersonation_sessions(target_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_impersonation_admin 
  ON public.audit_impersonation(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_impersonation_target 
  ON public.audit_impersonation(target_user_id);

CREATE INDEX IF NOT EXISTS idx_audit_impersonation_token 
  ON public.audit_impersonation(session_token);