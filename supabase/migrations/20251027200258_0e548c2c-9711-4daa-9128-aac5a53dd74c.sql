-- Remove a constraint antiga que não considera grupo_ano
ALTER TABLE matriz_componentes 
DROP CONSTRAINT IF EXISTS matriz_componentes_matriz_id_componente_nome_key;

-- Adiciona nova constraint única que considera matriz_id + componente_nome + grupo_ano
ALTER TABLE matriz_componentes 
ADD CONSTRAINT matriz_componentes_matriz_id_componente_nome_grupo_ano_key 
UNIQUE (matriz_id, componente_nome, grupo_ano);