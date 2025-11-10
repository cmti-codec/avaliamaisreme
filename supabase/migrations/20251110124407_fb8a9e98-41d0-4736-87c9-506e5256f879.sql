-- ==========================================
-- CORREÇÃO: Habilitar RLS nas tabelas de backup
-- ==========================================

-- Habilitar RLS nas tabelas de backup
ALTER TABLE IF EXISTS professores_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lotacoes_professores_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS usuarios_backup ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso apenas para ADMIN nas tabelas de backup
CREATE POLICY "Admin acessa backup professores" ON professores_backup
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin acessa backup lotacoes_professores" ON lotacoes_professores_backup
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin acessa backup usuarios" ON usuarios_backup
  FOR ALL USING (has_role(auth.uid(), 'ADMIN'));