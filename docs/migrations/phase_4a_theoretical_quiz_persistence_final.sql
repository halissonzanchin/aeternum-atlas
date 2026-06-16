-- Migration: Fase 4A - Simulados Teóricos (Persistência Final Adaptada)
-- Description: Cria as tabelas definitivas para a persistência dos Simulados Teóricos no Supabase.
-- Este schema foi adaptado propositalmente ao payload atual em produção, no qual o frontend 
-- já gera IDs lógicos em formato texto (ex: "theoretical-heart" e "mc-01").
-- Portanto, `quiz_id` e `question_id` são TEXT, e a tabela de tentativas inclui o `model_id`.

--------------------------------------------------------------------------------
-- 1. EXTENSÃO DA TABELA DE TENTATIVAS ANATÔMICAS (ANALYTICS)
--------------------------------------------------------------------------------
ALTER TABLE public.anatomical_quiz_attempts
ADD COLUMN IF NOT EXISTS class_id uuid references public.academic_classes(id) on delete set null;

CREATE INDEX IF NOT EXISTS anatomical_quiz_attempts_class_idx ON public.anatomical_quiz_attempts(class_id);

--------------------------------------------------------------------------------
-- 2. TABELAS DE SIMULADOS TEÓRICOS (Adaptadas para o Payload Frontend)
--------------------------------------------------------------------------------

-- 2.1 theoretical_quiz_attempts
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id text not null, -- TEXT para suportar IDs fixos do frontend (ex: 'theoretical-heart')
  model_id uuid references public.models_3d(id) on delete set null,
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
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 2.2 theoretical_quiz_answers
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.theoretical_quiz_attempts(id) on delete cascade,
  question_id text not null, -- TEXT para suportar IDs das perguntas (ex: 'mc-01')
  question_type text,
  student_answer jsonb,
  correct_answer jsonb,
  is_correct boolean not null default false,
  points_awarded numeric,
  explanation text,
  reference text,
  created_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE E RELATÓRIOS (ANALYTICS)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_quiz_idx ON public.theoretical_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_user_idx ON public.theoretical_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_inst_idx ON public.theoretical_quiz_attempts(institution_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_model_idx ON public.theoretical_quiz_attempts(model_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_created_idx ON public.theoretical_quiz_attempts(created_at);

--------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) - POLÍTICAS BÁSICAS E SEGURAS
--------------------------------------------------------------------------------
ALTER TABLE public.theoretical_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theoretical_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Tentativas: Aluno só vê as dele, Professores/Admins veem as da instituição
CREATE POLICY theoretical_attempts_user_isolation ON public.theoretical_quiz_attempts
  FOR SELECT USING (
    user_id = auth.uid() OR
    auth.jwt()->>'role' IN ('teacher', 'institution_admin', 'super_admin')
  );

CREATE POLICY theoretical_attempts_insert ON public.theoretical_quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Respostas: Aluno vê apenas as dele
CREATE POLICY theoretical_answers_user_isolation ON public.theoretical_quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.theoretical_quiz_attempts a 
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    ) OR
    auth.jwt()->>'role' IN ('teacher', 'institution_admin', 'super_admin')
  );

CREATE POLICY theoretical_answers_insert ON public.theoretical_quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.theoretical_quiz_attempts a 
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );
