

# Plano: Painel de Conselho de Classe

## O que será construído

Uma nova página dedicada ao **Conselho de Classe** onde a gestão escolar (diretor, secretário, coordenador) pode visualizar um painel consolidado com notas e frequências de **todos os professores** e **todos os componentes curriculares** de cada turma, por bimestre, para validar os dados e concluir o bimestre.

## Funcionalidades

1. **Página `/conselho-de-classe`** com filtros por bimestre e turma
2. **Painel de frequências consolidado**: tabela mostrando cada aluno x componente, com total de aulas, presenças, faltas e % de frequência
3. **Painel de notas consolidado**: tabela mostrando cada aluno x componente, com todas as avaliações e médias
4. **Status de entrega por professor**: indicador visual (verde/vermelho) mostrando se cada professor já lançou frequências e notas para aquele bimestre
5. **Ação de "Concluir bimestre"**: marca o conselho como realizado, ativando o bloqueio de edição (já implementado no `isEdicaoBloqueadaPorConselho`)

## Detalhes técnicos

### Banco de dados
- **Sem alterações de schema necessárias** — a tabela `conselhos_classe` já existe com todos os campos necessários (escola_id, bimestre_id, bloqueia_edicao_avaliacoes, etc.)
- A consulta consolidada será feita via queries no frontend, cruzando `diarios_classe`, `frequencias`, `avaliacoes`, `alunos` e `turmas`

### Novos arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/ConselhoClasse.tsx` | Página principal com filtros e painel |
| `src/hooks/useConselhoData.ts` | Hook que busca dados consolidados (frequências + notas) por turma/bimestre |
| `src/components/Conselho/PainelFrequencias.tsx` | Tabela alunos x componentes com % frequência |
| `src/components/Conselho/PainelNotas.tsx` | Tabela alunos x componentes com notas/médias |
| `src/components/Conselho/StatusProfessores.tsx` | Cards mostrando status de entrega por professor |

### Arquivos modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionar rota `/conselho-de-classe` |
| `src/components/Layout/AppSidebar.tsx` | Adicionar item no menu |

### Fluxo do hook `useConselhoData`
1. Recebe `escolaId`, `bimestreId`, `turmaId`
2. Busca todos os `diarios_classe` da turma
3. Para cada diário, busca frequências e avaliações dentro do período do bimestre
4. Retorna dados consolidados por aluno x componente

### Permissões
- Acessível para: ADMIN, DIRETOR, SECRETARIO, COORDENADOR
- RLS já existente nas tabelas `frequencias`, `avaliacoes` e `diarios_classe` permite leitura para gestores da escola

### Fluxo do usuário
1. Gestão acessa "Conselho de Classe" no menu
2. Seleciona o bimestre
3. Seleciona a turma (ou vê todas)
4. Visualiza painel com frequências e notas de todos os componentes
5. Verifica status de entrega de cada professor
6. Quando validado, clica "Realizar Conselho" que cria o registro em `conselhos_classe` e bloqueia edições futuras

