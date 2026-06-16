# PLANO DE EXECUÇÃO SUPABASE: FASE 4A (Persistência Teórica)

## 1. RESUMO EXECUTIVO E AUDITORIA GERAL

A auditoria revelou que **as tabelas teóricas ainda não existem no Supabase de produção**. O fluxo atual de simulados teóricos sobrevive 100% no `localStorage` porque o código possui um fallback silencioso (`try/catch` capturando o erro de tabela inexistente e persistindo na memória). 

No entanto, há um **Risco Crítico** identificado: o schema SQL desenhado na Fase 3C.1 possui incompatibilidades gravíssimas com o payload (JSON) que o frontend envia hoje. Se o script da Fase 3C.1 fosse rodado no Supabase agora, as gravações falhariam imediatamente com erros de violação de chave estrangeira (FK) e incompatibilidade de tipos de dados.

---

## 2. INCOMPATIBILIDADES CRÍTICAS ENCONTRADAS (Diagnóstico)

### A. Tipagem de ID e Chaves Estrangeiras Inexistentes
O schema planejava que `quiz_id` e `question_id` fossem do tipo `uuid` e referências restritas às tabelas pais (`theoretical_quizzes` e `theoretical_quiz_questions`). Porém, hoje os simulados teóricos são estáticos (hardcoded no código-fonte) e o frontend envia identificadores lógicos em formato de `string` (Ex: `quiz_id: "theoretical-heart_anatomy"`, `question_id: "mc-01"`). O Supabase recusaria esse formato de texto em colunas UUID.

### B. Ausência do `model_id` na Tabela de Tentativas
O payload do frontend explicitamente empurra o campo `model_id` no momento da submissão da tentativa (`recordTheoreticalQuizAttempt()`), mas o schema da Fase 3C.1 omitiu a coluna `model_id` na tabela `theoretical_quiz_attempts`, concentrando-a apenas na tabela-mãe. Isso causaria o erro: *column "model_id" of relation "theoretical_quiz_attempts" does not exist*.

### C. Suporte a Diferentes Tipos de Questões
A estrutura de `jsonb` das respostas individuais suporta perfeitamente os 5 tipos de questão sem necessidade de adaptação, sendo este um ponto forte da arquitetura atual.

---

## 3. SQL DEFINITIVO (CORRIGIDO PARA O PAYLOAD ATUAL)

Para resolver o gargalo sem tocar em uma única linha de código dos componentes visuais ou no service do frontend, devemos ajustar a `migration`. O novo schema aceitará IDs em formato texto para as provas atuais e desacoplará as amarras temporárias até que o módulo de criação de provas pelos professores esteja pronto.

**Script Otimizado a ser executado:**

```sql
--------------------------------------------------------------------------------
-- 1. EXTENSÃO DA TABELA DE TENTATIVAS ANATÔMICAS (ANALYTICS)
--------------------------------------------------------------------------------
ALTER TABLE public.anatomical_quiz_attempts
ADD COLUMN IF NOT EXISTS class_id uuid references public.academic_classes(id) on delete set null;

CREATE INDEX IF NOT EXISTS anatomical_quiz_attempts_class_idx ON public.anatomical_quiz_attempts(class_id);

--------------------------------------------------------------------------------
-- 2. NOVAS TABELAS DE SIMULADOS TEÓRICOS (ADAPTADAS)
--------------------------------------------------------------------------------

-- 2.1 theoretical_quizzes (Preparação futura, sem FK rigorosa nos logs)
CREATE TABLE IF NOT EXISTS public.theoretical_quizzes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  model_id uuid references public.models_3d(id) on delete set null,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  description text,
  time_limit_seconds integer not null default 3600,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 theoretical_quiz_questions
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.theoretical_quizzes(id) on delete cascade,
  topic text,
  question_type text not null,
  question_text text not null,
  options jsonb,
  correct_answer jsonb,
  accepted_answers jsonb,
  justification text,
  difficulty_level text default 'medium',
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2.3 theoretical_quiz_attempts (Modificada para suportar o payload)
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null, -- Alterado para TEXT para suportar "theoretical-heart"
  model_id uuid references public.models_3d(id) on delete set null, -- Adicionado!
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0,
  total_questions integer not null default 0,
  percentage numeric,
  duration_seconds integer,
  status text not null default 'in_progress',
  created_at timestamptz not null default now()
);

-- 2.4 theoretical_quiz_answers (Modificada para suportar o payload)
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.theoretical_quiz_attempts(id) on delete cascade,
  question_id text not null, -- Alterado para TEXT para suportar "mc-01"
  student_answer jsonb,
  is_correct boolean not null default false,
  feedback text,
  created_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 3. ÍNDICES E RLS BÁSICO
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_quiz_idx ON public.theoretical_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_user_idx ON public.theoretical_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_inst_idx ON public.theoretical_quiz_attempts(institution_id);

ALTER TABLE public.theoretical_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theoretical_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Políticas minimalistas e seguras para a arquitetura
CREATE POLICY theoretical_attempts_user_isolation ON public.theoretical_quiz_attempts
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' IN ('teacher', 'institution_admin', 'super_admin')
  );

CREATE POLICY theoretical_attempts_insert ON public.theoretical_quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY theoretical_answers_insert ON public.theoretical_quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.theoretical_quiz_attempts a 
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );
```

---

## 4. IMPACTOS E TESTE DE COMPATIBILIDADE LÓGICA

* **Dashboards:** A arquitetura atual dos Dashboards (ROI Institucional, Analytics Acadêmico) já puxa os dados destas exatas tabelas. Quando esta *migration* rodar e o frontend gravar nelas, os relatórios de engajamento do professor irão refletir instantaneamente a soma teórica.
* **Double-Count:** A Fase 3D.2 já está blindada contra contagem dupla de horas porque programamos que horas de simulados anatômicos não somem às do *Viewer*, mas horas teóricas somam (assumindo que o aluno possa fazê-las fora do 3D puro).
* **Riscos e Rollback:** Baixíssimo. Trata-se de adição (DDL). O *Rollback* seria puramente dropar as tabelas criadas: `DROP TABLE theoretical_quiz_answers, theoretical_quiz_attempts`. Nenhuma tabela crítica existente está sendo destruída.

---

## 5. CHECKLIST PÓS-MIGRATION

1. [] Executar SQL no SQL Editor do Supabase de produção.
2. [] Entrar na conta de um Aluno.
3. [] Iniciar e finalizar um Simulado Teórico qualquer (ex: Coração).
4. [] Checar no Supabase se as tabelas `theoretical_quiz_attempts` e `theoretical_quiz_answers` receberam a linha com o `model_id` não-nulo e `quiz_id` preenchidos.
5. [] Checar no painel do Diretor se as *Horas de Estudo Geradas* aumentaram.

---
**STATUS FINAL: PRONTO PARA EXECUTAR NO SUPABASE (com o SQL corrigido acima).**
