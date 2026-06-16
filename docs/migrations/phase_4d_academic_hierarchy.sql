-- Migration: Fase 4D - Academic Hierarchy Foundation
-- Description: Cria a estrutura hierárquica acadêmica (Campus, Curso, Período, Disciplina) 
-- para suportar operações em escala universitária B2B. Mantém total compatibilidade
-- retroativa com o modelo "Plano" original através de campos nullable em academic_classes.

--------------------------------------------------------------------------------
-- 1. NOVAS TABELAS HIERÁRQUICAS
--------------------------------------------------------------------------------

-- 1.1 academic_campuses
CREATE TABLE IF NOT EXISTS public.academic_campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 academic_courses
CREATE TABLE IF NOT EXISTS public.academic_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id uuid references public.academic_campuses(id) on delete set null,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.3 academic_terms (Períodos/Semestres)
CREATE TABLE IF NOT EXISTS public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, -- Ex: '2026.1', '1º Semestre 2026'
  start_date date,
  end_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.4 academic_subjects (Disciplinas)
CREATE TABLE IF NOT EXISTS public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  course_id uuid references public.academic_courses(id) on delete cascade,
  name text not null, -- Ex: 'Anatomia Humana I'
  code text, -- Código da disciplina (ex: MED-ANA-101)
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

--------------------------------------------------------------------------------
-- 2. ALTERAÇÃO NA TABELA DE TURMAS EXISTENTE (Retrocompatível)
--------------------------------------------------------------------------------

-- Adicionamos colunas nullable para amarrar a turma na nova hierarquia.
-- As turmas antigas continuarão funcionando perfeitamente (campos nulls são permitidos).
ALTER TABLE public.academic_classes
ADD COLUMN IF NOT EXISTS campus_id uuid references public.academic_campuses(id) on delete set null,
ADD COLUMN IF NOT EXISTS course_id uuid references public.academic_courses(id) on delete set null,
ADD COLUMN IF NOT EXISTS term_id uuid references public.academic_terms(id) on delete set null,
ADD COLUMN IF NOT EXISTS subject_id uuid references public.academic_subjects(id) on delete set null;

--------------------------------------------------------------------------------
-- 3. ÍNDICES DE PERFORMANCE PARA RELATÓRIOS E INTEGRAÇÕES
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS academic_campuses_inst_idx ON public.academic_campuses(institution_id);
CREATE INDEX IF NOT EXISTS academic_courses_inst_idx ON public.academic_courses(institution_id);
CREATE INDEX IF NOT EXISTS academic_courses_campus_idx ON public.academic_courses(campus_id);
CREATE INDEX IF NOT EXISTS academic_terms_inst_idx ON public.academic_terms(institution_id);
CREATE INDEX IF NOT EXISTS academic_subjects_inst_idx ON public.academic_subjects(institution_id);
CREATE INDEX IF NOT EXISTS academic_subjects_course_idx ON public.academic_subjects(course_id);

CREATE INDEX IF NOT EXISTS academic_classes_campus_idx ON public.academic_classes(campus_id);
CREATE INDEX IF NOT EXISTS academic_classes_course_idx ON public.academic_classes(course_id);
CREATE INDEX IF NOT EXISTS academic_classes_term_idx ON public.academic_classes(term_id);
CREATE INDEX IF NOT EXISTS academic_classes_subject_idx ON public.academic_classes(subject_id);

--------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) - ISOLAMENTO MULTI-TENANT
--------------------------------------------------------------------------------
ALTER TABLE public.academic_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_subjects ENABLE ROW LEVEL SECURITY;

-- Exemplo de Policies Base (As políticas exatas devem refletir a role JWT e o institution_id)
-- Usuários podem ler (SELECT) dados se pertencerem à instituição correta.
CREATE POLICY campuses_inst_isolation ON public.academic_campuses
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY courses_inst_isolation ON public.academic_courses
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY terms_inst_isolation ON public.academic_terms
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');

CREATE POLICY subjects_inst_isolation ON public.academic_subjects
  FOR SELECT USING (institution_id = auth.jwt()->>'institution_id');
