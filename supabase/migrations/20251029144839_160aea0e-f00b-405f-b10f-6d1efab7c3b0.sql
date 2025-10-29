-- Adicionar foreign key para escolas (a de turmas já existe)
ALTER TABLE public.alunos
ADD CONSTRAINT alunos_saesc_fkey
FOREIGN KEY (saesc)
REFERENCES public.escolas(id)
ON DELETE CASCADE;

-- Criar índices para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_alunos_saesc ON public.alunos(saesc);
CREATE INDEX IF NOT EXISTS idx_alunos_nomalu ON public.alunos(nomalu);