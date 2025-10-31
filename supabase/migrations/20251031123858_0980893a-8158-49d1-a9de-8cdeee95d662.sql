-- Adicionar gen_random_uuid() como default na coluna id da tabela usuarios
ALTER TABLE public.usuarios 
ALTER COLUMN id SET DEFAULT gen_random_uuid();