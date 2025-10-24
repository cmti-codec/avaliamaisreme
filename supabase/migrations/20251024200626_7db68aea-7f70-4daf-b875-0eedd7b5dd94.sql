-- ============================================
-- FASE 1: IMPLEMENTAÇÃO SEGURA DE ROLES
-- ============================================

-- 1. DROP DE POLICIES EXISTENTES QUE USAM get_user_perfil()
DROP POLICY IF EXISTS "Admin gestores veem logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin insere componentes" ON componentes_curriculares;
DROP POLICY IF EXISTS "Admin rede veem escolas" ON escolas;
DROP POLICY IF EXISTS "Admin rede atualizam escolas" ON escolas;
DROP POLICY IF EXISTS "Admin rede inserem escolas" ON escolas;
DROP POLICY IF EXISTS "Escolares veem escola" ON escolas;
DROP POLICY IF EXISTS "Admin insere formacoes" ON formacoes;
DROP POLICY IF EXISTS "Admin gerencia matriz componentes" ON matriz_componentes;
DROP POLICY IF EXISTS "Admin atualiza matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin deleta matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin insere matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin ve usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin gerencia usuarios" ON usuarios;
DROP POLICY IF EXISTS "Usuario ve proprio" ON usuarios;

-- 2. DROP DE FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS get_user_perfil();
DROP FUNCTION IF EXISTS get_user_escola_id();
DROP FUNCTION IF EXISTS tem_permissao(text, text);

-- 3. CRIAR ENUM DE ROLES (reutilizar perfil_usuario se existir)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'ADMIN',
    'GESTOR_SEMED',
    'TECNICO_SEMED',
    'DIRETOR',
    'SECRETARIO',
    'COORDENADOR',
    'PROFESSOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. CRIAR TABELA user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- 5. CRIAR FUNÇÕES SECURITY DEFINER (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id 
  ORDER BY 
    CASE role
      WHEN 'ADMIN' THEN 1
      WHEN 'GESTOR_SEMED' THEN 2
      WHEN 'TECNICO_SEMED' THEN 3
      WHEN 'DIRETOR' THEN 4
      WHEN 'SECRETARIO' THEN 5
      WHEN 'COORDENADOR' THEN 6
      WHEN 'PROFESSOR' THEN 7
    END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_escola_id(_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT escola_id 
  FROM public.user_roles 
  WHERE user_id = COALESCE(_user_id, auth.uid())
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.tem_permissao(func text, tipo text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  perfil_atual app_role;
BEGIN
  perfil_atual := get_user_role(auth.uid());
  
  IF perfil_atual = 'ADMIN' THEN
    RETURN true;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM permissoes_funcionalidade
    WHERE perfil = perfil_atual AND funcionalidade = func
    AND (
      (tipo = 'ler' AND pode_ler = true) OR
      (tipo = 'escrever' AND pode_escrever = true) OR
      (tipo = 'aprovar' AND pode_aprovar = true)
    )
  );
END;
$$;

-- 6. HABILITAR RLS em user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLICIES PARA user_roles
CREATE POLICY "Admins gerenciam roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'))
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Usuários veem suas roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 8. MIGRAR DADOS EXISTENTES
INSERT INTO public.user_roles (user_id, role, escola_id)
SELECT 
  id,
  perfil::text::app_role,
  escola_id
FROM public.usuarios
WHERE perfil IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 9. REMOVER COLUNA perfil da tabela usuarios
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS perfil;

-- 10. ATUALIZAR permissoes_funcionalidade
ALTER TABLE permissoes_funcionalidade 
  ALTER COLUMN perfil TYPE app_role USING perfil::text::app_role;

-- 11. RECRIAR POLICIES USANDO NOVAS FUNÇÕES

-- audit_logs
CREATE POLICY "Admin gestores veem logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'ADMIN') OR
  public.has_role(auth.uid(), 'GESTOR_SEMED') OR
  public.has_role(auth.uid(), 'TECNICO_SEMED') OR
  public.has_role(auth.uid(), 'DIRETOR') OR
  public.has_role(auth.uid(), 'SECRETARIO')
);

-- componentes_curriculares
CREATE POLICY "Admin insere componentes"
ON public.componentes_curriculares
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- escolas
CREATE POLICY "Admin rede veem escolas"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'ADMIN') OR
  public.has_role(auth.uid(), 'GESTOR_SEMED') OR
  public.has_role(auth.uid(), 'TECNICO_SEMED')
);

CREATE POLICY "Admin rede atualizam escolas"
ON public.escolas
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'ADMIN') OR
  public.has_role(auth.uid(), 'GESTOR_SEMED') OR
  public.has_role(auth.uid(), 'TECNICO_SEMED')
);

CREATE POLICY "Admin rede inserem escolas"
ON public.escolas
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'ADMIN') OR
  public.has_role(auth.uid(), 'GESTOR_SEMED') OR
  public.has_role(auth.uid(), 'TECNICO_SEMED')
);

CREATE POLICY "Escolares veem escola"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  id = public.get_user_escola_id(auth.uid()) AND
  (
    public.has_role(auth.uid(), 'DIRETOR') OR
    public.has_role(auth.uid(), 'SECRETARIO') OR
    public.has_role(auth.uid(), 'COORDENADOR') OR
    public.has_role(auth.uid(), 'PROFESSOR')
  )
);

-- formacoes
CREATE POLICY "Admin insere formacoes"
ON public.formacoes
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- matriz_componentes
CREATE POLICY "Admin gerencia matriz componentes"
ON public.matriz_componentes
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- matrizes_curriculares
CREATE POLICY "Admin atualiza matrizes"
ON public.matrizes_curriculares
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin deleta matrizes"
ON public.matrizes_curriculares
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin insere matrizes"
ON public.matrizes_curriculares
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'ADMIN'));

-- usuarios
CREATE POLICY "Admin ve usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin gerencia usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Usuario ve proprio"
ON public.usuarios
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 12. CRIAR TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.audit_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  role app_role NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_roles_user_id ON audit_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_roles_changed_at ON audit_roles(changed_at);

-- RLS para audit_roles
ALTER TABLE public.audit_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins veem audit roles"
ON public.audit_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- 13. TRIGGER PARA AUDITAR MUDANÇAS EM ROLES
CREATE OR REPLACE FUNCTION audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_roles (user_id, action, role, changed_by)
    VALUES (NEW.user_id, 'ADDED', NEW.role, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_roles (user_id, action, role, changed_by)
    VALUES (OLD.user_id, 'REMOVED', OLD.role, auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_audit_roles ON user_roles;
CREATE TRIGGER trigger_audit_roles
AFTER INSERT OR DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION audit_role_changes();