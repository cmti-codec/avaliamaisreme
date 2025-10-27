-- 1. Criar tabela de alunos
CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saesc UUID NOT NULL,
  numalu TEXT NOT NULL,
  nomalu TEXT NOT NULL,
  nummtr TEXT,
  datmtr DATE,
  sigeta TEXT NOT NULL,
  trmcla TEXT NOT NULL,
  sigtur TEXT NOT NULL,
  sigla TEXT,
  desoca TEXT,
  sioca TEXT,
  dtomtrc DATE,
  turma_id UUID REFERENCES public.turmas(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(saesc, numalu)
);

-- RLS para alunos
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem alunos da sua escola"
  ON public.alunos FOR SELECT
  USING (saesc IN (
    SELECT id FROM public.escolas WHERE id IN (
      SELECT escola_id FROM public.usuarios WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Admin vê todos alunos"
  ON public.alunos FOR SELECT
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admin insere alunos"
  ON public.alunos FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admin atualiza alunos"
  ON public.alunos FOR UPDATE
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- 2. Criar tabela de logs de importação
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  tipo_importacao TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  total_linhas INTEGER NOT NULL,
  linhas_sucesso INTEGER NOT NULL,
  linhas_erro INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'sucesso_parcial', 'erro')),
  detalhes_erros JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin vê logs"
  ON public.import_logs FOR SELECT
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

CREATE POLICY "Admin cria logs"
  ON public.import_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'ADMIN'::app_role));

-- 3. Adicionar campos faltantes em escolas
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS saesc UUID;
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS localidade TEXT;
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS regiao TEXT;

-- Criar índice único para saesc se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'escolas_saesc_key'
  ) THEN
    ALTER TABLE public.escolas ADD CONSTRAINT escolas_saesc_key UNIQUE (saesc);
  END IF;
END $$;

-- 4. Adicionar campos em professores
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS matricula TEXT;
ALTER TABLE public.professores ADD COLUMN IF NOT EXISTS telefone TEXT;

-- Criar índices únicos para cpf e matricula se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professores_cpf_key'
  ) THEN
    ALTER TABLE public.professores ADD CONSTRAINT professores_cpf_key UNIQUE (cpf);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'professores_matricula_key'
  ) THEN
    ALTER TABLE public.professores ADD CONSTRAINT professores_matricula_key UNIQUE (matricula);
  END IF;
END $$;

-- 5. Criar tabela de cargas horárias
CREATE TABLE IF NOT EXISTS public.cargas_horarias_componentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  componente_nome TEXT NOT NULL,
  etapa_modalidade TEXT NOT NULL,
  grupo_ano TEXT NOT NULL,
  carga_horaria_semanal INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(componente_nome, etapa_modalidade, grupo_ano)
);

ALTER TABLE public.cargas_horarias_componentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem cargas"
  ON public.cargas_horarias_componentes FOR SELECT
  USING (true);

CREATE POLICY "Admin gerencia cargas"
  ON public.cargas_horarias_componentes FOR ALL
  USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Trigger para updated_at em alunos
CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();