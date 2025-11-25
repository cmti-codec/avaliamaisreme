# 📋 ROTEIRO DE TESTES - SISTEMA DE GESTÃO ESCOLAR

## ✅ PREPARAÇÃO CONCLUÍDA

### 🎯 Escolas Configuradas
- **EM NAZIRA ANACHE** - 23 turmas ativas
- **EMEI ALBA LÚCIA SPENGLER DOS SANTOS PEREIRA** - 19 turmas ativas

### 📚 Matrizes Atribuídas

#### EM NAZIRA ANACHE
- ✅ **EI-PARCIAL-EM** → Grupos 4 e 5 ESCOLA (12 turmas)
- ✅ **EF1-1A5-PARCIAL** → 1º ao 5º ano (40 turmas)
- ✅ **EF1-6A9-PARCIAL** → 6º e 7º ano (8 turmas)

#### EMEI ALBA LÚCIA
- ✅ **EI-EMEI** → Grupos 1I, 1II, 2, 3, 4 EMEI, 5 EMEI (19 turmas)

---

## 👥 USUÁRIOS PARA TESTE

### 🔐 ADMINISTRADOR
| Nome | Email | Senha | Acesso |
|------|-------|-------|--------|
| Guilherme Ferrari | prof.guilhermeferrari@gmail.com | *(use recuperação)* | Total |

### 📊 COORDENADOR (EM NAZIRA ANACHE)
| Nome | Email | Perfil | Escola |
|------|-------|--------|--------|
| GUI MATHIAS | email@example.com | COORDENADOR + PROFESSOR | EM NAZIRA ANACHE |

### 👨‍🏫 PROFESSORES (EM NAZIRA ANACHE) - 15 ATIVOS
| Nome | Email |
|------|-------|
| ADRIANA ASSIS SILVA | adriana.assis.silva93@exemplo.com |
| ANA MARIA DE ALMEIDA | prof.mat.aninhaw2@gmail.com |
| ANNALDINA LUCAS PELZL | anita.pelzl@gmail.com |
| ARTHUR JOÃO GOMES DE OLIVEIRA | arthur.joao.gomes.de.oliveira37@exemplo.com |
| DANIEL FELIPE FUHR | danielfelipe04@gmail.com |
| ELIZABETE PUCK PEREIRA MELO | elizabete.puck.pereira.melo61@exemplo.com |
| GISLAINE SARTORIO ANDRADE | gislaine.sartorio.andrade1@exemplo.com |
| HERSON NARUHITO NONAKA | herson.naruhito.nonaka10@exemplo.com |
| JACQUELINE ORTIZ SEMIDEI | jacqueline.ortiz.semidei60@exemplo.com |
| JULIANA CARLOS AQUINO VASSAN | juliana.carlos.aquino.vassan45@exemplo.com |
| MARCOS DE OLIVEIRA MONTEIRO | marcos.de.oliveira.monteiro67@exemplo.com |
| MICHELANGELO PULCHERIO AGUADO | michelangelo.pulcherio.aguado10@exemplo.com |
| NADIR PEREIRA DOS SANTOS | nadir.pereira.dos.santos79@exemplo.com |
| REGINALDO LUIZ GONCALVES | reginaldo.luiz.goncalves60@exemplo.com |

### ⚠️ EMEI ALBA LÚCIA - PENDÊNCIAS
- ❌ **Sem professores cadastrados**
- ❌ **Sem Diretor cadastrado**
- ❌ **Sem Secretário cadastrado**

---

## 🧪 FASES DE TESTE

### **FASE 1: Configuração Base (ADMIN)** 🔴 BLOQUEADOR
**Objetivo:** Criar estrutura temporal e permitir funcionamento do sistema

#### 1.1. Criar Ano Letivo 2025
- [ ] Login como **Guilherme Ferrari** (admin)
- [ ] Acessar **Datas & Prazos**
- [ ] Criar Ano Letivo 2025 para **EM NAZIRA ANACHE**
  - Data início: 03/02/2025
  - Data fim: 19/12/2025
  - ✅ Sistema criará automaticamente 4 bimestres
- [ ] Criar Ano Letivo 2025 para **EMEI ALBA LÚCIA**
  - Data início: 03/02/2025
  - Data fim: 19/12/2025

**Resultado Esperado:**
- ✅ 2 anos letivos criados
- ✅ 8 bimestres criados automaticamente (4 por escola)
- ✅ Sistema pronto para receber horários e diários

---

### **FASE 2: Montar Equipe EMEI (ADMIN)** 🔴 BLOQUEADOR
**Objetivo:** Criar equipe completa para EMEI Alba Lúcia

#### 2.1. Cadastrar Professores no Pool
- [ ] Acessar **Admin → Pool de Professores**
- [ ] Criar **5 novos professores**:
  - Professor 1: Maria Silva (Pedagoga)
  - Professor 2: João Santos (Letras)
  - Professor 3: Ana Costa (Pedagogia)
  - Professor 4: Carlos Lima (Educação Física)
  - Professor 5: Rita Souza (Artes)

#### 2.2. Lotar Professores na EMEI
- [ ] Para cada professor criado:
  - Criar lotação na EMEI Alba Lúcia
  - Perfil: PROFESSOR
  - Carga: 20h semanais
  - Data início: 03/02/2025

#### 2.3. Criar Diretor e Secretário
- [ ] Criar usuário **Diretor EMEI Alba Lúcia**
  - Email: diretor.alba@teste.com
  - Nome: Diretor Alba Teste
  - Role: DIRETOR
  - Escola: EMEI Alba Lúcia
- [ ] Criar usuário **Secretário EMEI Alba Lúcia**
  - Email: secretario.alba@teste.com
  - Nome: Secretário Alba Teste
  - Role: SECRETARIO
  - Escola: EMEI Alba Lúcia

**Resultado Esperado:**
- ✅ 5 professores no pool
- ✅ 5 lotações ativas na EMEI
- ✅ 1 Diretor com acesso
- ✅ 1 Secretário com acesso
- ✅ EMEI pronta para testes

---

### **FASE 3: Atribuir Cargas (COORDENADOR)** 🔴 BLOQUEADOR
**Objetivo:** Definir cargas horárias para professores da Nazira

#### 3.1. Atribuir Cargas aos Professores
- [ ] Login como **GUI MATHIAS** (coordenador)
- [ ] Acessar **Professores → EM NAZIRA ANACHE**
- [ ] Para cada um dos 15 professores:
  - Abrir detalhes do professor
  - Atribuir carga horária (sugestão: 20h ou 40h)
  - Atribuir horas PL (sugestão: 5h ou 10h)
  - Salvar

**Distribuição Sugerida:**
- 10 professores: 20h aula + 5h PL = 25h total
- 5 professores: 40h aula + 10h PL = 50h total

**Resultado Esperado:**
- ✅ 15 professores com cargas definidas
- ✅ Sistema permitirá criar horários
- ✅ Validação de 50h máximas na rede ativa

---

### **FASE 4: Criar Horários (COORDENADOR)** 🟡 FUNCIONAL
**Objetivo:** Montar grade de horários e testar conflitos

#### 4.1. Horários EM NAZIRA ANACHE
- [ ] Login como **GUI MATHIAS**
- [ ] Acessar **Horários → Lançamento**
- [ ] Selecionar turma: **1º ANO A (Matutino)**
- [ ] Testar atribuições:
  - [ ] Segunda-feira, Tempo 1: Língua Portuguesa (Prof. ANA MARIA)
  - [ ] Segunda-feira, Tempo 2: Matemática (Prof. DANIEL FELIPE)
  - [ ] Tentar alocar mesmo professor em dois lugares simultâneos
    - ✅ Sistema deve bloquear e mostrar conflito
  - [ ] Tentar exceder quota de componente da matriz
    - ✅ Sistema deve bloquear

#### 4.2. Horários EMEI ALBA LÚCIA (Turmas Integrais)
- [ ] Login como **Diretor Alba**
- [ ] Selecionar turma: **GRUPO 1 I A (Integral)**
- [ ] Atribuir professores:
  - [ ] Manhã: Professor 1 (todos os tempos)
  - [ ] Tarde: Professor 2 (todos os tempos)
  - ✅ Sistema deve criar 2 diários automaticamente (MATUTINO + VESPERTINO)

**Resultado Esperado:**
- ✅ Horários criados sem conflitos
- ✅ Validações de conflito funcionando
- ✅ Turmas integrais com 2 turnos configurados
- ✅ Diários criados automaticamente após horários

---

### **FASE 5: Diário de Classe (PROFESSOR)** 🟢 TESTE FINAL
**Objetivo:** Lançar frequências e validar persistência

#### 5.1. Lançamento de Frequência (Nazira)
- [ ] Login como **ANA MARIA DE ALMEIDA**
- [ ] Acessar **Diário de Classe**
- [ ] Verificar se turmas aparecem (apenas com horários criados)
- [ ] Selecionar turma **1º ANO A**
- [ ] Lançar frequência:
  - [ ] Data: dia letivo atual
  - [ ] Marcar 5 alunos presentes
  - [ ] Marcar 2 alunos ausentes
  - [ ] Adicionar observação em 1 falta
  - [ ] Salvar
- [ ] Fazer logout e login novamente
- [ ] Verificar se dados persistiram

#### 5.2. Atividades Diversas (Secretário EMEI)
- [ ] Login como **Secretário Alba**
- [ ] Acessar **Diário → Atividades Diversas**
- [ ] Selecionar turma integral **GRUPO 1 I A**
- [ ] Lançar frequência auxiliar:
  - [ ] Manhã: 10 presentes
  - [ ] Tarde: 10 presentes
  - [ ] Salvar
- [ ] Verificar totalização no sistema

**Resultado Esperado:**
- ✅ Frequências salvas corretamente
- ✅ Dados persistem após logout
- ✅ Turmas integrais somam 2 turnos + auxiliar
- ✅ Sistema calcula % de presença

---

## 📊 VALIDAÇÕES CRÍTICAS

### ✅ Checklist de Validação

#### Fluxo Completo
- [ ] Admin cria Ano Letivo → Bimestres criados automaticamente
- [ ] Coordenador atribui cargas → Professores aparecem em horários
- [ ] Coordenador cria horários → Diários criados automaticamente
- [ ] Professor lança frequência → Dados persistem

#### Regras de Negócio
- [ ] Professor não pode ter mais de 50h na rede
- [ ] Professor não pode estar em 2 lugares simultaneamente
- [ ] Componente não pode exceder quota da matriz
- [ ] Turmas integrais criam 2 diários (manhã + tarde)
- [ ] Secretário pode lançar atividades diversas
- [ ] Após conselho, edições são bloqueadas

#### Performance
- [ ] Sistema responde em < 2s para listas
- [ ] Salvamento de frequência instantâneo
- [ ] Sem erros de carregamento ou travamentos

---

## 🚨 BLOQUEADORES IDENTIFICADOS

### ❌ CRÍTICOS (Impedem testes)
1. **Ano Letivo não existe** → Impede criação de horários e diários
2. **Professores sem carga horária** → Impede atribuição em horários
3. **EMEI sem equipe** → Impede teste de fluxo completo

### ⚠️ IMPORTANTES (Limitam testes)
1. **Turmas sem matriz** → ✅ RESOLVIDO (matrizes atribuídas)
2. **Faltam usuários para EMEI** → Precisa cadastro manual

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Matrizes atribuídas** (CONCLUÍDO)
2. 🔴 **Criar Ano Letivo 2025** (ADMIN - FASE 1)
3. 🔴 **Cadastrar equipe EMEI** (ADMIN - FASE 2)
4. 🟡 **Atribuir cargas professores Nazira** (COORDENADOR - FASE 3)
5. 🟢 **Testes funcionais** (FASES 4-5)

---

## 📝 OBSERVAÇÕES

- Todos os emails com `@exemplo.com` precisam usar recuperação de senha
- GUI MATHIAS é coordenador E professor (pode testar ambos os fluxos)
- Turmas integrais (EMEI) precisam de 2 professores + 1 auxiliar
- Sistema valida 50h máximas por professor na rede inteira
- Após criar horários, diários são gerados automaticamente

---

## 🆘 SUPORTE

Em caso de erros:
1. Verificar console do navegador (F12)
2. Verificar logs no backend
3. Confirmar RLS policies para o perfil do usuário
4. Verificar se Ano Letivo foi criado corretamente

---

**Última Atualização:** 25/01/2025
**Status:** Preparação inicial completa - Pronto para FASE 1
