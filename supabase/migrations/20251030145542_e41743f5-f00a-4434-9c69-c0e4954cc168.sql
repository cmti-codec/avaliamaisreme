-- Remover políticas restritivas atuais
DROP POLICY IF EXISTS "Usuários veem professores da sua escola" ON professores;
DROP POLICY IF EXISTS "Usuários podem inserir professores na sua escola" ON professores;

-- Admin vê todos professores (incluindo pool REME)
CREATE POLICY "Admin vê todos professores"
  ON professores FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'));

-- Admin gerencia todos professores
CREATE POLICY "Admin gerencia professores"
  ON professores FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'ADMIN'))
  WITH CHECK (has_role(auth.uid(), 'ADMIN'));

-- Gestão escolar vê professores do pool REME (escola_id IS NULL) + professores da sua escola
CREATE POLICY "Gestão vê pool REME e sua escola"
  ON professores FOR SELECT
  TO authenticated
  USING (
    escola_id IS NULL 
    OR escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())
  );

-- Gestão escolar pode inserir professores no pool REME ou na sua escola
CREATE POLICY "Gestão insere professores"
  ON professores FOR INSERT
  TO authenticated
  WITH CHECK (
    escola_id IS NULL 
    OR escola_id IN (SELECT escola_id FROM usuarios WHERE id = auth.uid())
  );