-- Migration: Fase 3C - Simulados Teóricos e Analytics Acadêmicos
-- Description: Adiciona class_id aos simulados anatômicos existentes e cria as tabelas completas para Simulados Teóricos.

--------------------------------------------------------------------------------
-- 1. EXTENSÃO DA TABELA DE TENTATIVAS ANATÔMICAS (ANALYTICS)
--------------------------------------------------------------------------------
ALTER TABLE public.anatomical_quiz_attempts
ADD COLUMN IF NOT EXISTS class_id uuid references public.academic_classes(id) on delete set null;

CREATE INDEX IF NOT EXISTS anatomical_quiz_attempts_class_idx ON public.anatomical_quiz_attempts(class_id);

--------------------------------------------------------------------------------
-- 2. NOVAS TABELAS DE SIMULADOS TEÓRICOS
--------------------------------------------------------------------------------

-- 2.1 theoretical_quizzes (Cabeçalho do Simulado)
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

-- 2.2 theoretical_quiz_questions (Corpo das Perguntas)
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.theoretical_quizzes(id) on delete cascade,
  topic text,
  question_type text not null, -- 'multiple_choice', 'true_false', 'short_answer', 'fill_in_the_blank', 'matching'
  question_text text not null,
  options jsonb, -- Array das alternativas
  correct_answer jsonb, -- Resposta esperada formal
  accepted_answers jsonb, -- Respostas alternativas para correção automática (Fill, Short)
  justification text,
  bibliographic_reference text,
  difficulty_level text default 'medium',
  anatomical_tags text[], -- Array text
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2.3 theoretical_quiz_attempts (Tentativas dos Alunos)
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.theoretical_quizzes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0,
  total_questions integer not null default 0,
  percentage numeric,
  duration_seconds integer,
  status text not null default 'in_progress', -- 'in_progress', 'completed'
  created_at timestamptz not null default now()
);

-- 2.4 theoretical_quiz_answers (Respostas Individuais dos Alunos)
CREATE TABLE IF NOT EXISTS public.theoretical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.theoretical_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.theoretical_quiz_questions(id) on delete cascade,
  student_answer jsonb,
  is_correct boolean not null default false,
  feedback text, -- Feedback manual do professor em questões discursivas
  created_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE (ANALYTICS)
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS theoretical_quizzes_institution_idx ON public.theoretical_quizzes(institution_id);
CREATE INDEX IF NOT EXISTS theoretical_quizzes_class_idx ON public.theoretical_quizzes(class_id);
CREATE INDEX IF NOT EXISTS theoretical_quizzes_teacher_idx ON public.theoretical_quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_quiz_idx ON public.theoretical_quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_user_idx ON public.theoretical_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_class_idx ON public.theoretical_quiz_attempts(class_id);
CREATE INDEX IF NOT EXISTS theoretical_quiz_attempts_institution_idx ON public.theoretical_quiz_attempts(institution_id);

--------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) - POLÍTICAS BÁSICAS
--------------------------------------------------------------------------------
ALTER TABLE public.theoretical_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theoretical_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theoretical_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theoretical_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Exemplo Clássico (Supondo que RLS é usado com jwt_claims)
-- Apenas um escopo ilustrativo conforme solicitado para validação:

-- Quizzes: Todos os usuários logados veem os quizzes de sua instituição
CREATE POLICY theoretical_quizzes_institution_isolation ON public.theoretical_quizzes
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

-- Tentativas: Aluno só vê as dele, Professor vê os da sua instituição/turma
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
