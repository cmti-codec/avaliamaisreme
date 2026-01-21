-- Criar ano letivo 2026 com bimestres automáticos (trigger já existe)
INSERT INTO public.anos_letivos (ano, data_inicio, data_fim, ativo)
VALUES (2026, '2026-02-02', '2026-12-18', true)
ON CONFLICT (ano) DO NOTHING;