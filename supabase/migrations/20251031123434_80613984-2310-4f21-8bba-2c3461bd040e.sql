-- Adicionar coluna para rastrear impersonação
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS impersonated_by uuid REFERENCES public.usuarios(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_impersonated_by ON public.usuarios(impersonated_by);

-- Função helper para obter o ID efetivo do usuário (considerando impersonação)
CREATE OR REPLACE FUNCTION public.get_effective_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id FROM usuarios WHERE impersonated_by = auth.uid() LIMIT 1),
    auth.uid()
  )
$$;

-- Atualizar RLS policies para usar get_effective_user_id() ao invés de auth.uid()

-- ========== ALUNOS ==========
DROP POLICY IF EXISTS "Usuários veem alunos da sua escola" ON public.alunos;
CREATE POLICY "Usuários veem alunos da sua escola"
ON public.alunos
FOR SELECT
TO authenticated
USING (
  saesc IN (
    SELECT escolas.id
    FROM escolas
    WHERE escolas.id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = get_effective_user_id()
    )
  )
);

-- ========== AUDIT_LOGS ==========
DROP POLICY IF EXISTS "Admin gestores veem logs" ON public.audit_logs;
CREATE POLICY "Admin gestores veem logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
  has_role(get_effective_user_id(), 'SECRETARIO'::app_role)
);

-- ========== AUDIT_ROLES ==========
DROP POLICY IF EXISTS "Admins veem audit roles" ON public.audit_roles;
CREATE POLICY "Admins veem audit roles"
ON public.audit_roles
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

-- ========== ESCOLA_MATRIZES ==========
DROP POLICY IF EXISTS "Admin rede gerenciam escola_matrizes" ON public.escola_matrizes;
CREATE POLICY "Admin rede gerenciam escola_matrizes"
ON public.escola_matrizes
FOR ALL
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
)
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

DROP POLICY IF EXISTS "Admin rede veem escola_matrizes" ON public.escola_matrizes;
CREATE POLICY "Admin rede veem escola_matrizes"
ON public.escola_matrizes
FOR SELECT
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

DROP POLICY IF EXISTS "Escolares veem matrizes da escola" ON public.escola_matrizes;
CREATE POLICY "Escolares veem matrizes da escola"
ON public.escola_matrizes
FOR SELECT
TO authenticated
USING (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role) OR
    has_role(get_effective_user_id(), 'PROFESSOR'::app_role)
  )
);

-- ========== ESCOLAS ==========
DROP POLICY IF EXISTS "Admin rede atualizam escolas" ON public.escolas;
CREATE POLICY "Admin rede atualizam escolas"
ON public.escolas
FOR UPDATE
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

DROP POLICY IF EXISTS "Admin rede inserem escolas" ON public.escolas;
CREATE POLICY "Admin rede inserem escolas"
ON public.escolas
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

DROP POLICY IF EXISTS "Admin rede veem escolas" ON public.escolas;
CREATE POLICY "Admin rede veem escolas"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  has_role(get_effective_user_id(), 'ADMIN'::app_role) OR
  has_role(get_effective_user_id(), 'GESTOR_SEMED'::app_role) OR
  has_role(get_effective_user_id(), 'TECNICO_SEMED'::app_role)
);

DROP POLICY IF EXISTS "Escolares veem escola" ON public.escolas;
CREATE POLICY "Escolares veem escola"
ON public.escolas
FOR SELECT
TO authenticated
USING (
  (id = get_user_escola_id(get_effective_user_id())) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role) OR
    has_role(get_effective_user_id(), 'PROFESSOR'::app_role)
  )
);

-- ========== HORARIOS ==========
DROP POLICY IF EXISTS "Usuários veem horários de turmas da sua escola" ON public.horarios;
CREATE POLICY "Usuários veem horários de turmas da sua escola"
ON public.horarios
FOR SELECT
TO authenticated
USING (
  turma_id IN (
    SELECT turmas.id
    FROM turmas
    WHERE turmas.escola_id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = get_effective_user_id()
    )
  )
);

-- ========== IMPORT_LOGS ==========
DROP POLICY IF EXISTS "Admin vê logs" ON public.import_logs;
CREATE POLICY "Admin vê logs"
ON public.import_logs
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

-- ========== LOTACOES_PROFESSORES ==========
DROP POLICY IF EXISTS "Admin gerencia lotações" ON public.lotacoes_professores;
CREATE POLICY "Admin gerencia lotações"
ON public.lotacoes_professores
FOR ALL
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admin vê todas lotações" ON public.lotacoes_professores;
CREATE POLICY "Admin vê todas lotações"
ON public.lotacoes_professores
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Escola gerencia suas lotações" ON public.lotacoes_professores;
CREATE POLICY "Escola gerencia suas lotações"
ON public.lotacoes_professores
FOR ALL
TO authenticated
USING (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  )
)
WITH CHECK (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  )
);

DROP POLICY IF EXISTS "Escola vê suas lotações" ON public.lotacoes_professores;
CREATE POLICY "Escola vê suas lotações"
ON public.lotacoes_professores
FOR SELECT
TO authenticated
USING (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  )
);

-- ========== PROFESSORES ==========
DROP POLICY IF EXISTS "Admin gerencia professores" ON public.professores;
CREATE POLICY "Admin gerencia professores"
ON public.professores
FOR ALL
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admin vê todos professores" ON public.professores;
CREATE POLICY "Admin vê todos professores"
ON public.professores
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Gestores escolares inserem professores" ON public.professores;
CREATE POLICY "Gestores escolares inserem professores"
ON public.professores
FOR INSERT
TO authenticated
WITH CHECK (
  (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  ) AND (
    escola_id IS NULL OR 
    escola_id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = get_effective_user_id()
    )
  )
);

DROP POLICY IF EXISTS "Gestores escolares veem pool REME e sua escola" ON public.professores;
CREATE POLICY "Gestores escolares veem pool REME e sua escola"
ON public.professores
FOR SELECT
TO authenticated
USING (
  (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  ) AND (
    escola_id IS NULL OR 
    escola_id IN (
      SELECT usuarios.escola_id
      FROM usuarios
      WHERE usuarios.id = get_effective_user_id()
    )
  )
);

-- ========== TURMAS ==========
DROP POLICY IF EXISTS "Admin vê todas turmas" ON public.turmas;
CREATE POLICY "Admin vê todas turmas"
ON public.turmas
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admin atualiza turmas" ON public.turmas;
CREATE POLICY "Admin atualiza turmas"
ON public.turmas
FOR UPDATE
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admin deleta turmas" ON public.turmas;
CREATE POLICY "Admin deleta turmas"
ON public.turmas
FOR DELETE
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admins podem inserir turmas" ON public.turmas;
CREATE POLICY "Admins podem inserir turmas"
ON public.turmas
FOR INSERT
TO authenticated
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Gestores atualizam turmas da escola" ON public.turmas;
CREATE POLICY "Gestores atualizam turmas da escola"
ON public.turmas
FOR UPDATE
TO authenticated
USING (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  )
)
WITH CHECK (
  (escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )) AND (
    has_role(get_effective_user_id(), 'DIRETOR'::app_role) OR
    has_role(get_effective_user_id(), 'SECRETARIO'::app_role) OR
    has_role(get_effective_user_id(), 'COORDENADOR'::app_role)
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir turmas na sua escola" ON public.turmas;
CREATE POLICY "Usuários podem inserir turmas na sua escola"
ON public.turmas
FOR INSERT
TO authenticated
WITH CHECK (
  escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )
);

DROP POLICY IF EXISTS "Usuários veem turmas da sua escola" ON public.turmas;
CREATE POLICY "Usuários veem turmas da sua escola"
ON public.turmas
FOR SELECT
TO authenticated
USING (
  escola_id IN (
    SELECT usuarios.escola_id
    FROM usuarios
    WHERE usuarios.id = get_effective_user_id()
  )
);

-- ========== USER_ROLES ==========
DROP POLICY IF EXISTS "Admins gerenciam roles" ON public.user_roles;
CREATE POLICY "Admins gerenciam roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Usuários veem suas roles" ON public.user_roles;
CREATE POLICY "Usuários veem suas roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = get_effective_user_id());

-- ========== USUARIOS ==========
DROP POLICY IF EXISTS "Admin gerencia usuarios" ON public.usuarios;
CREATE POLICY "Admin gerencia usuarios"
ON public.usuarios
FOR ALL
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role))
WITH CHECK (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Admin ve usuarios" ON public.usuarios;
CREATE POLICY "Admin ve usuarios"
ON public.usuarios
FOR SELECT
TO authenticated
USING (has_role(get_effective_user_id(), 'ADMIN'::app_role));

DROP POLICY IF EXISTS "Usuario ve proprio" ON public.usuarios;
CREATE POLICY "Usuario ve proprio"
ON public.usuarios
FOR SELECT
TO authenticated
USING (id = get_effective_user_id());