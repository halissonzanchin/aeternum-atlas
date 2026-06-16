# Planejamento do Dashboard Pedagógico e ROI Institucional (Fase 3D)

Este documento detalha o planejamento arquitetural e de negócios para os módulos de Analytics avançado da Aeternum Atlas. O objetivo é mapear o tesouro de dados já disponível no ecossistema e transformá-lo em Dashboards acionáveis para Professores, Coordenadores e Instituições.

---

## 1. Visão Geral
A arquitetura atual (baseada nas tabelas `quiz_attempts`, `quiz_answers`, `model_access_logs` e `academic_classes`) já acumula uma quantidade massiva de metadados transacionais. A Fase 3D visa transformar esses dados brutos em **Inteligência Pedagógica** (para salvar alunos em risco) e **Inteligência Comercial** (ROI, para garantir renovações de contrato).

---

## 2. Dashboards Planejados e Mapeamento de Métricas

### A) Dashboard Pedagógico do Professor
Foco: Gestão de sala de aula e intervenção rápida.
* **Média da Turma:** Usa `quiz_attempts` filtrado por `class_id`. (Tabela: *anatomical_quiz_attempts* / *theoretical...*). **Status:** Já existe. **Prioridade:** Alta.
* **Evolução da Turma:** Série temporal de notas agrupadas por semana. **Status:** Já existe. **Risco:** Baixo.
* **Alunos em Risco:** Alunos com nota média muito inferior ou zero acessos (`model_access_logs`). **Status:** Já existe. **Prioridade:** Altíssima (Impacto de retenção).
* **Ranking de Alunos:** Somatório de scores por `user_id` via `class_id`. **Status:** Já existe.
* **Modelos Mais Estudados:** Agrupamento de `model_access_logs` daquela turma. **Status:** Já existe.

### B) Heatmap Anatômico
Foco: Precisão cirúrgica na correção de aprendizado.
* **Estruturas Mais Erradas:** Agrupamento de `anatomical_quiz_answers` por `question_id` ou `marker_number` onde `is_correct = false`. **Status:** Já existe. **Risco de Performance:** Médio (Requer varredura grande de respostas).
* **Modelos com Maior Dificuldade:** Cruzamento das tentativas com notas baixas e seus respectivos `model_id`. **Status:** Já existe.
* **Sugestões de Revisão:** Mapear o erro na estrutura anatômica para recomendar retornar ao Viewer. **Status:** Depende de lógica no Frontend (Cruzamento).

### C) Dashboard do Coordenador
Foco: Visão macro da engrenagem acadêmica.
* **Turmas e Professores Ativos:** `academic_classes` e `users`. **Status:** Já existe.
* **Alunos Ativos vs. Inativos:** Alunos matriculados (`academic_class_students`) cruzados com acessos recentes (`model_access_logs`). **Status:** Já existe.
* **Uso por Disciplina/Instituição:** Acessos agrupados em larga escala. **Status:** Já existe.

### D) ROI Institucional (Retorno Sobre o Investimento)
Foco: Justificativa comercial para a Universidade manter a assinatura SaaS.
* **Total de Simulados / Acessos:** Agregados globais (`count`). **Status:** Já existe.
* **Horas de Estudo Acumuladas:** Soma de `duration_seconds` e `session_duration_seconds`. **Status:** Já existe.
* **Economia Estimada de Laboratório:** KPI comercial multiplicando o número de horas de simulação virtual pelo custo médio de homem/hora em um laboratório físico (ou desgaste de peças sintéticas). **Status:** Depende de dados reais (fórmula comercial hardcoded no frontend inicialmente).

---

## 3. Matriz de Dependências

| Métrica / Dashboard | Banco Atual? | Depende de Migration? | Depende de Dados Reais? |
| :--- | :---: | :---: | :---: |
| Analítico Anatômico (Notas) | ✅ Sim | ❌ Não | ❌ Não (Funciona Mock) |
| Analítico Teórico (Notas) | ⚠️ Preparado | ✅ Sim (Fase 3C.1) | ❌ Não |
| Heatmap de Erros | ✅ Sim | ❌ Não | ⚠️ Ideal para amostragem |
| Alunos em Risco | ✅ Sim | ❌ Não | ✅ Sim (Pra ver dispersão) |
| Economia Laboratorial | ✅ Sim (Base) | ❌ Não | ❌ Não |

---

## 4. Proposta de Arquitetura Técnica (Fase 3D)

**Camada de Serviços (Services):**
* `src/services/academic/teacherAnalyticsService.js`: Foco em queries restritas por `class_id`.
* `src/services/academic/heatmapAnalyticsService.js`: Queries densas na tabela `quiz_answers`.
* `src/services/academic/institutionalRoiService.js`: Cálculos financeiros e agregadores macro.

**Possíveis View/RPC (Supabase):**
Devido ao volume massivo que o **Heatmap Anatômico** e o **ROI Institucional** podem gerar, será vital transferir as queries pesadas para o backend do Supabase em breve.
* *Recomendação Futura:* Criar uma RPC (`calculate_anatomical_heatmap`) que devolva o array sumarizado diretamente, poupando a rede e o navegador de calcular JSONs com 50.000 respostas.

---

## 5. Ordem de Implementação Recomendada (Plano de Fases)

1. **Fase 3D.1:** Dashboard do Professor (Alunos em Risco e Evolução da Turma). É a dor imediata do docente.
2. **Fase 3D.2:** Painel de ROI Institucional. É a dor comercial da Aeternum Atlas (prova de valor).
3. **Fase 3D.3:** Heatmap Anatômico. (Funcionalidade "Wow Factor", complexidade técnica alta).
4. **Fase 3D.4:** RPCs de Performance. (Otimização Server-Side, aplicar apenas quando a volumetria exigir).

---

## 6. Impacto Geral
* **Pedagógico:** Permite que o professor abandone a postura passiva e realize **intervenções direcionadas** semanas antes das provas oficiais.
* **Comercial:** O painel de ROI converte o uso em **R$ / US$** economizados, blindando a startup Aeternum Atlas contra cancelamentos (*churn*), provando que o software é incrivelmente mais barato e seguro que a manutenção de um necrotério acadêmico físico.
