-- Criar tabela de escolas
CREATE TABLE IF NOT EXISTS public.escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  codigo_inep TEXT UNIQUE,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de usuários (profiles)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
  perfil TEXT CHECK (perfil IN ('admin', 'coordenador', 'diretor', 'professor', 'secretario')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de componentes curriculares
CREATE TABLE IF NOT EXISTS public.componentes_curriculares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  sigla TEXT CHECK (length(sigla) <= 3),
  cor TEXT,
  segmentos JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de formações
CREATE TABLE IF NOT EXISTS public.formacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  componentes_permitidos JSONB,
  segmentos JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de professores
CREATE TABLE IF NOT EXISTS public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE NOT NULL,
  formacoes JSONB,
  carga_horaria_contratual INTEGER DEFAULT 20,
  horas_pl INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de turmas
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE NOT NULL,
  segmento TEXT NOT NULL,
  grupo_ano TEXT NOT NULL,
  turma TEXT NOT NULL,
  turno TEXT CHECK (turno IN ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL')),
  matriz_curricular JSONB,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (escola_id, segmento, grupo_ano, turma, turno)
);

-- Criar tabela de horários
CREATE TABLE IF NOT EXISTS public.horarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE NOT NULL,
  dia_semana TEXT CHECK (dia_semana IN ('Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta')),
  tempo INTEGER CHECK (tempo BETWEEN 1 AND 8),
  componente_curricular TEXT NOT NULL,
  professor_id UUID REFERENCES public.professores(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  UNIQUE (turma_id, dia_semana, tempo)
);

-- Criar tabela de eventos de professores
CREATE TABLE IF NOT EXISTS public.professor_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE NOT NULL,
  dia_semana TEXT CHECK (dia_semana IN ('Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta')),
  tempo INTEGER CHECK (tempo BETWEEN 1 AND 8),
  tipo_evento TEXT CHECK (tipo_evento IN ('PL', 'PLL')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (professor_id, dia_semana, tempo)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_horarios_professor ON public.horarios(professor_id);
CREATE INDEX IF NOT EXISTS idx_horarios_turma ON public.horarios(turma_id);
CREATE INDEX IF NOT EXISTS idx_turmas_escola ON public.turmas(escola_id);
CREATE INDEX IF NOT EXISTS idx_professores_escola ON public.professores(escola_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_escola ON public.usuarios(escola_id);

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.componentes_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professor_eventos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Admin (vê tudo)
CREATE POLICY "Admin pode ver tudo em escolas"
  ON public.escolas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

CREATE POLICY "Admin pode inserir em escolas"
  ON public.escolas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

CREATE POLICY "Admin pode atualizar escolas"
  ON public.escolas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

-- Políticas RLS para usuários verem apenas sua escola
CREATE POLICY "Usuários veem apenas sua escola"
  ON public.escolas FOR SELECT
  USING (
    id IN (
      SELECT escola_id FROM public.usuarios
      WHERE usuarios.id = auth.uid()
    )
  );

-- Políticas para componentes_curriculares (todos podem ver)
CREATE POLICY "Todos podem ver componentes curriculares"
  ON public.componentes_curriculares FOR SELECT
  USING (true);

CREATE POLICY "Admin pode inserir componentes curriculares"
  ON public.componentes_curriculares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

-- Políticas para formacoes (todos podem ver)
CREATE POLICY "Todos podem ver formações"
  ON public.formacoes FOR SELECT
  USING (true);

CREATE POLICY "Admin pode inserir formações"
  ON public.formacoes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

-- Políticas para professores (apenas da mesma escola)
CREATE POLICY "Usuários veem professores da sua escola"
  ON public.professores FOR SELECT
  USING (
    escola_id IN (
      SELECT escola_id FROM public.usuarios
      WHERE usuarios.id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir professores na sua escola"
  ON public.professores FOR INSERT
  WITH CHECK (
    escola_id IN (
      SELECT escola_id FROM public.usuarios
      WHERE usuarios.id = auth.uid()
    )
  );

-- Políticas para turmas (apenas da mesma escola)
CREATE POLICY "Usuários veem turmas da sua escola"
  ON public.turmas FOR SELECT
  USING (
    escola_id IN (
      SELECT escola_id FROM public.usuarios
      WHERE usuarios.id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir turmas na sua escola"
  ON public.turmas FOR INSERT
  WITH CHECK (
    escola_id IN (
      SELECT escola_id FROM public.usuarios
      WHERE usuarios.id = auth.uid()
    )
  );

-- Políticas para horários
CREATE POLICY "Usuários veem horários de turmas da sua escola"
  ON public.horarios FOR SELECT
  USING (
    turma_id IN (
      SELECT id FROM public.turmas
      WHERE escola_id IN (
        SELECT escola_id FROM public.usuarios
        WHERE usuarios.id = auth.uid()
      )
    )
  );

-- Políticas para professor_eventos
CREATE POLICY "Usuários veem eventos de professores da sua escola"
  ON public.professor_eventos FOR SELECT
  USING (
    professor_id IN (
      SELECT id FROM public.professores
      WHERE escola_id IN (
        SELECT escola_id FROM public.usuarios
        WHERE usuarios.id = auth.uid()
      )
    )
  );

-- Políticas para usuários (cada um vê apenas seu próprio registro)
CREATE POLICY "Usuários veem apenas seu próprio registro"
  ON public.usuarios FOR SELECT
  USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() AND u.perfil = 'admin'
  ));

CREATE POLICY "Admin pode ver todos os usuários"
  ON public.usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'admin'
    )
  );

-- Trigger para atualizar updated_at em horários
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_horarios_updated_at
  BEFORE UPDATE ON public.horarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();