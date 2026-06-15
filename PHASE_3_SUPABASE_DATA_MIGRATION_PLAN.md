# FASE 3 — PLANO DE MIGRAÇÃO DE DADOS (SUPABASE)

Este documento estabelece o diagnóstico e o planejamento profissional para migrar definitivamente a Aeternum Atlas do estágio de "Mocks e LocalStorage" para o consumo integral de dados reais do Supabase.

---

## 1. Diagnóstico Geral
A plataforma concluiu a modernização arquitetural e possui camadas de UI e Lógica bem desacopladas. Entretanto, a camada de Serviços (`src/services/` e `src/data/`) ainda consome ativamente 11 arquivos de Mocks e utiliza intensivamente o `localStorage` para métricas, agendas e simulados teóricos.

A migração será faseada para mitigar o risco de quebras críticas em funcionalidades essenciais como o Visualizador 3D.

---

## 2. Fontes de Dados Voláteis Encontradas

### 2.1 Mocks Encontrados (`src/data/`)
1. `mockStudyAgenda.js` (Agenda Fake)
2. `mockInstitutionalAnalytics.js` (KPIs, Relatórios de Admin, Lista de Alunos)
3. `mockAnalytics.js` e `mockGlobalAnalytics.js` (Super Admin KPIs)
4. `mockPlans.js` (Planos e Assinaturas Fakes)
5. `mockStructures.js` e `viewerSystems.js` (Estruturas e Categorias Fakes)
6. `localModels.js` (Modelos e Metadados Locais)
7. `mockCourses.js` e `mockInstitution.js` (Dados de Instituição Fake)

### 2.2 Uso de LocalStorage (`src/hooks/` e `src/services/storage/`)
1. **Agenda de Estudos:** `useStudyAgenda.js`
2. **Progresso de Simulados e Notas:** `storageService.js` (utilizado por `progressService`, `theoreticalQuizService` e `anatomicalQuizService`).

### 2.3 Dados Estáticos em Arrays (Hardcoded)
1. **Simulados Teóricos:** Arrays como `multipleChoiceQuestions` e `trueFalseQuestions` encontram-se travados dentro de `theoreticalQuizService.js`.

---

## 3. Análise do Supabase (Schema Atual)

### 3.1 Tabelas Disponíveis para Migração
* `users`, `institutions`, `student_profiles`, `teacher_profiles`
* `models_3d`, `model_access_logs`
* `study_agenda`
* `academic_classes`, `academic_class_students`
* `anatomical_quizzes`, `anatomical_quiz_questions`, `anatomical_quiz_attempts`, `anatomical_quiz_answers`

### 3.2 Tabelas Ainda Insuficientes ou Inexistentes
Para extinguir todos os mocks, o Schema precisará evoluir:
* **Planos e Assinaturas:** Faltam tabelas como `plans`, `subscriptions` e `payments`.
* **Simulados Teóricos:** Faltam tabelas como `theoretical_quizzes`, `theoretical_quiz_questions` e `theoretical_quiz_attempts`. (O schema atual só cobre simulados *anatômicos*).
* **Progresso Agregado:** Falta uma tabela ou view materializada como `student_progress_summary`.

---

## 4. Matriz de Migração (Risco e Prioridade)

| MÓDULO | DADO ATUAL | ORIGEM ATUAL | TABELA DESTINO | RISCO | PRIORIDADE | AÇÃO RECOMENDADA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Agenda** | Tarefas do aluno | `localStorage` | `study_agenda` | Baixo | 1 (Alta) | Atualizar `useStudyAgenda` para CRUD no Supabase. |
| **Dashboard Aluno** | Métricas de estudo | `mockInstitutionalAnalytics` | `model_access_logs` | Médio | 2 (Alta) | Refatorar `useDashboardData` para buscar *logs* reais. |
| **Admin Institution** | Relatórios e Alunos | `mockInstitutionalAnalytics` | `users` + `academic_class_students` | Alto | 3 (Alta) | Limpar Mocks; cruzar dados reais de usuários com relatórios. |
| **Biblioteca 3D** | Modelos | `localModels.js` | `models_3d` | Médio | 4 (Média) | Inserir os arrays JSON no DB e manter `localModels` só como Fallback. |
| **Simulado Teórico**| Perguntas e Respostas | `theoreticalQuizService` | `theoretical_quizzes` (A Criar) | Médio | 5 (Média) | Criar migrations de tabelas teóricas; extrair arrays do JS. |
| **Assinaturas** | Planos e Pagamentos | `mockPlans.js` | `subscriptions` (A Criar) | Alto | 6 (Baixa) | Arquitetar módulo transacional seguro (pós fase 3D). |

---

## 5. Roadmap de Implementação (A Ordem Recomendada)

* **Fase 3A — Dashboard com Dados Reais:** Migrar os KPIs do Dashboard Aluno para lerem acesso real ao visualizador (`model_access_logs`).
* **Fase 3B — Agenda de Estudos no Supabase:** Abandonar o LocalStorage do calendário. Impacto rápido e visível de cross-device.
* **Fase 3C — Painel Institucional e Professor:** Fazer o Hook de `useStudentFilters` consultar os usuários reais atrelados à instituição logada.
* **Fase 3D — Biblioteca e Modelos:** Substituir o `localModels` pelo consumo da API `supabase.from('models_3d')`.
* **Fase 3E — Simulados Teóricos e Assinaturas (Requer Migrations):** Evoluir o schema e alimentar os arrays de questões no banco.

---

## 6. Riscos, Rollbacks e Testes Necessários

### 6.1 Riscos Principais
* **Quebra Crítica de UI:** Componentes como Gráficos e Tabelas esperam o payload exato dos *Mocks*. A mudança de estrutura das *queries* do Supabase pode causar crash.
* **Perda Temporária de Métricas:** Alunos acharão que seu progresso zerou durante a troca de `localStorage` para o Banco.

### 6.2 Estratégia de Rollback
* Todos os novos acessos ao banco devem ocorrer dentro dos `Services`, nunca nos Componentes. Se uma migração falhar (ex: `getDashboardData`), o serviço poderá retornar o antigo `mockAnalytics` via cláusula `try/catch`, atuando como Fallback de segurança instantâneo.

### 6.3 Testes Necessários
* **Pós 3A/3C:** Verificar integridade do carregamento dos Dashboards.
* **Pós 3B:** Logar com mesmo usuário em aba anônima e verificar se a Agenda se mantém sincronizada.
* **Pós 3D:** Confirmar se as listagens de modelos não quebram ao alternar abas de categorias na Home.
