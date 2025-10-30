
-- Permitir escola_id NULL na tabela professores (para pool da REME)
ALTER TABLE professores 
ALTER COLUMN escola_id DROP NOT NULL;

-- Adicionar constraint única em usuario_id
ALTER TABLE professores
ADD CONSTRAINT professores_usuario_id_unique UNIQUE (usuario_id);

-- Criar registros na tabela professores para usuários existentes com role PROFESSOR
INSERT INTO professores (
  usuario_id, 
  nome, 
  email, 
  matricula, 
  cargo, 
  funcao_atual, 
  escola_id, 
  ativo, 
  carga_horaria_contratual,
  horas_pl
)
VALUES 
  ('b6ab0856-ca73-44d2-b41b-11466d12e45e', 'anita.pelzl', 'anita.pelzl@gmail.com', 'PROF001', 'PROFESSOR', 'PROFESSOR', NULL, true, 40, 0),
  ('a282596e-123e-4400-897e-ef1653b714e7', 'danielfelipe04', 'danielfelipe04@gmail.com', 'PROF002', 'PROFESSOR', 'PROFESSOR', NULL, true, 40, 0),
  ('725102e1-7101-4224-8f28-5e53a65702d0', 'prof.mat.aninhaw2', 'prof.mat.aninhaw2@gmail.com', 'PROF003', 'PROFESSOR', 'PROFESSOR', NULL, true, 40, 0),
  ('130afdc6-8609-4b90-ab7b-d23548ff2078', 'Teste', 'email@example.com', 'PROF004', 'PROFESSOR', 'PROFESSOR', NULL, true, 40, 0)
ON CONFLICT (usuario_id) DO NOTHING
