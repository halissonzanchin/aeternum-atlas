# Auditoria de Maturidade das Tabelas Acadêmicas - Supabase (Fase 3B)

Este relatório compila o nível de prontidão estrutural (Readiness) do banco de dados Supabase da Aeternum Atlas para receber os fluxos acadêmicos reais. A análise baseia-se no schema DDL atual do sistema (`src/services/supabase/schema.sql`).

---

## 1. Turmas e Matrículas

### 1.1 `academic_classes` (Turmas/Disciplinas)
1. **Estrutura Atual:** Criação e parametrização de disciplinas vinculadas a um professor e a uma instituição.
2. **Quantidade de Registros:** (Dependente do ambiente Supabase/Remoto).
3. **Relacionamentos:** `institution_id` (institutions), `teacher_id` (users). Delete em cascata habilitado.
4. **Campos Obrigatórios:** `id`, `institution_id`, `teacher_id`, `name`, `status`.
5. **Campos Ausentes/Melhorias:** Falta um campo `slug` ou `join_code` caso a intenção seja permitir que o aluno se matricule através de um código.
6. **Viabilidade:** Alta (pronta para uso).
7. **Necessidade de Migration:** Baixa (Apenas se o fluxo de "convite por código" for exigido no curto prazo).
8. **Risco:** Baixo.

### 1.2 `academic_class_students` (Vínculo Aluno-Turma)
1. **Estrutura Atual:** Tabela associativa NxN.
2. **Quantidade de Registros:** (Dependente do ambiente).
3. **Relacionamentos:** `institution_id` (institutions), `class_id` (academic_classes), `student_id` (users).
4. **Campos Obrigatórios:** `id`, `institution_id`, `class_id`, `student_id`.
5. **Campos Ausentes/Melhorias:** Faltam campos de `status` (ex: pendente, aprovado) caso o professor precise aprovar o ingresso do aluno, e um `role` (aluno, monitor).
6. **Viabilidade:** Alta.
7. **Necessidade de Migration:** Média. 
8. **Risco:** Baixo.

---

## 2. Ferramentas Didáticas (Teacher Tools)

### 2.1 `teacher_lesson_plans` (Planos de Aula)
1. **Estrutura Atual:** Armazena planejamentos de aula usando JSONB para listas flexíveis de modelos.
2. **Quantidade de Registros:** (Dependente do ambiente).
3. **Relacionamentos:** `institution_id`, `teacher_id`, `class_id` (Opcional, `set null`).
4. **Campos Obrigatórios:** `id`, `institution_id`, `teacher_id`, `title`, `status`.
5. **Campos Ausentes:** Sem anomalias críticas. JSONB fornece boa flexibilidade para `model_ids` e `objectives`.
6. **Viabilidade:** Alta.
7. **Necessidade de Migration:** Nenhuma imediata.
8. **Risco:** Baixo.

### 2.2 `teacher_study_guides` (Roteiros de Estudo)
1. **Estrutura Atual:** Guias assíncronos enviados aos alunos, com `due_date`.
2. **Quantidade de Registros:** (Dependente do ambiente).
3. **Relacionamentos:** `institution_id`, `teacher_id`, `class_id` (`set null`).
4. **Campos Obrigatórios:** `id`, `institution_id`, `teacher_id`, `title`, `status`.
5. **Campos Ausentes:** Falta uma tabela auxiliar (ex: `study_guide_completions`) para mapear se o aluno de fato leu/completou o roteiro.
6. **Viabilidade:** Média (Permite o professor criar, mas o *tracking* do aluno ficará limitado sem tabela extra).
7. **Necessidade de Migration:** Média (Para rastrear progresso do aluno).
8. **Risco:** Médio (Risco de expectativa não atendida por parte do professor de não ver quem entregou).

### 2.3 `teacher_anatomical_notes` (Notas Clínicas do Professor)
1. **Estrutura Atual:** Permite criar notas personalizadas para estruturas 3D, enriquecendo o Viewer.
2. **Quantidade de Registros:** (Dependente do ambiente).
3. **Relacionamentos:** `institution_id`, `teacher_id`, `model_id`.
4. **Campos Obrigatórios:** `id`, `institution_id`, `teacher_id`, `note_type`, `description`, `priority`, `status`, `visibility`.
5. **Campos Ausentes:** Nenhuma.
6. **Viabilidade:** Alta.
7. **Necessidade de Migration:** Nenhuma.
8. **Risco:** Médio (Integrar isso dinamicamente dentro do `ViewerContext` e Sketchfab iFrame requer alta destreza de UI/UX para não quebrar a performance 3D).

---

## 3. Avaliações (Simulados Anatômicos)

### 3.1 `anatomical_quizzes` (O Simulado)
1. **Estrutura Atual:** Cabeçalho do Quiz amarrado a um Modelo 3D específico.
2. **Quantidade de Registros:** (Dependente do ambiente).
3. **Relacionamentos:** `model_id`, `institution_id`.
4. **Campos Obrigatórios:** `id`, `model_id`, `institution_id`, `title`, `time_limit_seconds`, `active`.
5. **Campos Ausentes:** Falta amarração opcional com `class_id` (para o professor enviar o quiz apenas para sua turma, e não para a instituição inteira).
6. **Viabilidade:** Alta.
7. **Necessidade de Migration:** Média (Adicionar `class_id`).
8. **Risco:** Baixo.

### 3.2 `anatomical_quiz_questions` (Perguntas)
1. **Estrutura Atual:** Mapeia a pergunta (pino do Sketchfab `marker_number`) com arrays textuais.
2. **Relacionamentos:** `quiz_id` em cascata.
3. **Campos Obrigatórios:** `quiz_id`, `marker_number`, `correct_answer`, `order_index`.
4. **Campos Ausentes:** Não comporta as perguntas puramente Teóricas (Multipla Escolha), servindo estritamente para o Simulado de Identificação 3D.
5. **Viabilidade:** Alta (Para Práticas).

### 3.3 `anatomical_quiz_attempts` e `anatomical_quiz_answers` (Tentativas e Respostas)
1. **Estrutura Atual:** Guarda a nota geral (`score`, `percentage`) e o fluxo de respostas dadas (input do aluno).
2. **Relacionamentos:** `user_id`, `model_id`, `quiz_id`, `institution_id`.
3. **Campos Obrigatórios:** `score`, `total_questions`, `status`, `correct_answer`.
4. **Viabilidade:** Altíssima. Esse é o core engine de analytics dos alunos.
5. **Risco:** Baixo.

---

## Conclusões Executivas

1. **Prontas para Produção (Verdes):** 
   - Turmas (`academic_classes`) e Matrículas (`academic_class_students`).
   - Planos de Aula (`teacher_lesson_plans`).
   - Simulados Anatômicos (`anatomical_quizzes` e derivadas).
2. **Requerem Ajustes (Amarelas):** 
   - `anatomical_quizzes` (Falta vínculo opcional com a Turma para segmentar o simulado).
   - `teacher_study_guides` (Falta controle de entrega/conclusão pelo aluno).
3. **Faltantes (Vermelhas):**
   - Não há estrutura para **Simulados Teóricos** (Múltipla Escolha e Verdadeiro/Falso). As tabelas focam 100% nos pinos do Sketchfab.
4. **Recomendação Tática (Fase 3B):**
   - O primeiro módulo a ser implementado deverá ser as **Turmas (Classes) e Matrículas**. Elas formam o alicerce para que Professores vejam seus alunos de verdade e que os relatórios parem de refletir a instituição inteira. Em seguida, os **Simulados Anatômicos**.
