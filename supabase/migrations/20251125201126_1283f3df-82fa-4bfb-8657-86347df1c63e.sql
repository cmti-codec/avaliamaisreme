-- Passo 1: Remover policies que dependem de escola_id em anos_letivos
DROP POLICY IF EXISTS "escola_ve_proprios_exames" ON public.exames_finais;
DROP POLICY IF EXISTS "escola_ve_proprios_anos" ON public.anos_letivos;
DROP POLICY IF EXISTS "escola_ve_proprios_bimestres" ON public.bimestres;
DROP POLICY IF EXISTS "Admin pode criar anos letivos" ON public.anos_letivos;
DROP POLICY IF EXISTS "Admin pode editar anos letivos" ON public.anos_letivos;
DROP POLICY IF EXISTS "Todos podem visualizar anos letivos" ON public.anos_letivos;

-- Passo 2: Remover campo escola_id da tabela anos_letivos
ALTER TABLE public.anos_letivos DROP COLUMN escola_id;

-- Passo 3: Adicionar constraint UNIQUE no campo ano para evitar duplicatas
ALTER TABLE public.anos_letivos ADD CONSTRAINT anos_letivos_ano_key UNIQUE (ano);

-- Passo 4: Criar novas policies para anos_letivos (único para toda REME)
CREATE POLICY "Gestores rede podem criar anos letivos"
ON public.anos_letivos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED')
  )
);

CREATE POLICY "Gestores rede podem editar anos letivos"
ON public.anos_letivos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED')
  )
);

CREATE POLICY "Todos podem visualizar anos letivos"
ON public.anos_letivos
FOR SELECT
TO authenticated
USING (true);

-- Passo 5: Recriar policy para bimestres (agora sem referência a escola_id)
CREATE POLICY "Todos podem visualizar bimestres"
ON public.bimestres
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestores rede podem editar bimestres"
ON public.bimestres
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED')
  )
);

-- Passo 6: Recriar policy para exames_finais (agora sem referência a escola_id)
CREATE POLICY "Todos podem visualizar exames finais"
ON public.exames_finais
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestores rede podem gerenciar exames finais"
ON public.exames_finais
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED')
  )
);