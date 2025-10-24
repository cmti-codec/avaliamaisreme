-- 1. REMOVER POLÍTICAS QUE USAM perfil
DROP POLICY IF EXISTS "Admin pode ver todos os logs" ON audit_logs;
DROP POLICY IF EXISTS "Admin pode inserir componentes curriculares" ON componentes_curriculares;
DROP POLICY IF EXISTS "Admin pode atualizar escolas" ON escolas;
DROP POLICY IF EXISTS "Admin pode inserir em escolas" ON escolas;
DROP POLICY IF EXISTS "Admin pode ver tudo em escolas" ON escolas;
DROP POLICY IF EXISTS "Usuários veem apenas sua escola" ON escolas;
DROP POLICY IF EXISTS "Admin pode inserir formações" ON formacoes;
DROP POLICY IF EXISTS "Admin pode atualizar matriz_componentes" ON matriz_componentes;
DROP POLICY IF EXISTS "Admin pode deletar matriz_componentes" ON matriz_componentes;
DROP POLICY IF EXISTS "Admin pode inserir matriz_componentes" ON matriz_componentes;
DROP POLICY IF EXISTS "Admin pode atualizar matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin pode deletar matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin pode inserir matrizes" ON matrizes_curriculares;
DROP POLICY IF EXISTS "Admin pode ver todos os usuários" ON usuarios;
DROP POLICY IF EXISTS "Usuários veem apenas seu próprio registro" ON usuarios;

-- 2. CRIAR ENUM
CREATE TYPE perfil_usuario AS ENUM (
  'ADMIN',
  'GESTOR_SEMED',
  'TECNICO_SEMED',
  'DIRETOR',
  'SECRETARIO',
  'COORDENADOR',
  'PROFESSOR'
);

-- 3. RENOMEAR coluna antiga
ALTER TABLE usuarios RENAME COLUMN perfil TO perfil_old;

-- 4. CRIAR nova coluna com tipo enum
ALTER TABLE usuarios ADD COLUMN perfil perfil_usuario;

-- 5. MIGRAR dados (converter minúsculas para maiúsculas)
UPDATE usuarios SET perfil = 'ADMIN'::perfil_usuario WHERE LOWER(perfil_old) = 'admin';
UPDATE usuarios SET perfil = 'GESTOR_SEMED'::perfil_usuario WHERE LOWER(perfil_old) IN ('gestor_semed', 'gestor semed');
UPDATE usuarios SET perfil = 'TECNICO_SEMED'::perfil_usuario WHERE LOWER(perfil_old) IN ('tecnico_semed', 'tecnico semed');
UPDATE usuarios SET perfil = 'DIRETOR'::perfil_usuario WHERE LOWER(perfil_old) = 'diretor';
UPDATE usuarios SET perfil = 'SECRETARIO'::perfil_usuario WHERE LOWER(perfil_old) = 'secretario';
UPDATE usuarios SET perfil = 'COORDENADOR'::perfil_usuario WHERE LOWER(perfil_old) = 'coordenador';
UPDATE usuarios SET perfil = 'PROFESSOR'::perfil_usuario WHERE LOWER(perfil_old) = 'professor';

-- 6. Tornar coluna NOT NULL
ALTER TABLE usuarios ALTER COLUMN perfil SET NOT NULL;

-- 7. REMOVER coluna antiga
ALTER TABLE usuarios DROP COLUMN perfil_old;

-- 8. Criar índices
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_escola_id ON usuarios(escola_id);

-- 9. CRIAR TABELA DE PERMISSÕES
CREATE TABLE permissoes_funcionalidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil perfil_usuario NOT NULL,
  funcionalidade TEXT NOT NULL,
  pode_ler BOOLEAN DEFAULT false,
  pode_escrever BOOLEAN DEFAULT false,
  pode_aprovar BOOLEAN DEFAULT false,
  UNIQUE (perfil, funcionalidade)
);

-- 10. INSERIR PERMISSÕES
INSERT INTO permissoes_funcionalidade (perfil, funcionalidade, pode_ler, pode_escrever, pode_aprovar)
VALUES
  ('ADMIN', 'gestao_usuarios', true, true, true),
  ('ADMIN', 'gestao_matrizes', true, true, true),
  ('ADMIN', 'gerenciamento_turmas_horarios', true, true, true);

-- 11. FUNÇÕES SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_user_perfil()
RETURNS perfil_usuario AS $$
  SELECT perfil FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_escola_id()
RETURNS UUID AS $$
  SELECT escola_id FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION tem_permissao(func TEXT, tipo TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  perfil_atual perfil_usuario;
BEGIN
  perfil_atual := get_user_perfil();
  
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 12. RECRIAR RLS POLICIES
CREATE POLICY "Admin gestores veem logs" ON audit_logs
  FOR SELECT USING (get_user_perfil() IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED', 'DIRETOR', 'SECRETARIO'));

CREATE POLICY "Admin insere componentes" ON componentes_curriculares
  FOR INSERT WITH CHECK (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin rede veem escolas" ON escolas
  FOR SELECT USING (get_user_perfil() IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED'));

CREATE POLICY "Admin rede atualizam escolas" ON escolas
  FOR UPDATE USING (get_user_perfil() IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED'));

CREATE POLICY "Admin rede inserem escolas" ON escolas
  FOR INSERT WITH CHECK (get_user_perfil() IN ('ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED'));

CREATE POLICY "Escolares veem escola" ON escolas
  FOR SELECT USING (
    id = get_user_escola_id() AND 
    get_user_perfil() IN ('DIRETOR', 'SECRETARIO', 'COORDENADOR', 'PROFESSOR')
  );

CREATE POLICY "Admin insere formacoes" ON formacoes
  FOR INSERT WITH CHECK (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin gerencia matriz componentes" ON matriz_componentes
  FOR ALL USING (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin atualiza matrizes" ON matrizes_curriculares
  FOR UPDATE USING (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin deleta matrizes" ON matrizes_curriculares
  FOR DELETE USING (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin insere matrizes" ON matrizes_curriculares
  FOR INSERT WITH CHECK (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin ve usuarios" ON usuarios
  FOR SELECT USING (get_user_perfil() = 'ADMIN');

CREATE POLICY "Admin gerencia usuarios" ON usuarios
  FOR ALL USING (get_user_perfil() = 'ADMIN');

CREATE POLICY "Usuario ve proprio" ON usuarios
  FOR SELECT USING (id = auth.uid());

ALTER TABLE permissoes_funcionalidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem permissoes" ON permissoes_funcionalidade
  FOR SELECT USING (true);