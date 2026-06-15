-- Aeternum Atlas - Supabase/PostgreSQL initial schema
-- Multi-tenant rule: every institutional record carries institution_id.

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  country text,
  city text,
  active boolean not null default true,
  contracted_capacity integer not null default 0,
  active_students integer not null default 0,
  price_per_student numeric(12,2) not null default 0,
  contract_status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  name text not null,
  email text unique not null,
  role text not null check (role in ('student', 'teacher', 'institution_admin', 'super_admin')),
  status text not null default 'active',
  avatar_url text,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  course text,
  semester text,
  registration_number text,
  progress_score integer not null default 0,
  total_study_minutes integer not null default 0,
  favorite_models jsonb not null default '[]'::jsonb,
  last_access_at timestamptz
);

create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  department text,
  specialization text,
  allowed_models jsonb not null default '[]'::jsonb,
  academic_title text
);

create table if not exists public.models_3d (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  slug text not null,
  anatomical_system text,
  anatomical_region text,
  sketchfab_url text,
  embed_url text,
  difficulty_level text,
  tags jsonb not null default '[]'::jsonb,
  status text not null default 'available',
  thumbnail_url text,
  created_at timestamptz not null default now(),
  unique (institution_id, slug)
);

create table if not exists public.model_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete cascade,
  model_id uuid references public.models_3d(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  interactions_count integer not null default 0,
  annotations_opened integer not null default 0,
  device_type text
);

create table if not exists public.study_agenda (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text,
  date date not null,
  priority text not null default 'medium',
  anatomical_system text,
  linked_model_id uuid references public.models_3d(id) on delete set null,
  status text not null default 'pending',
  reminder_enabled boolean not null default false
);

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  model_id uuid references public.models_3d(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists users_institution_role_idx on public.users(institution_id, role);
create index if not exists models_3d_institution_idx on public.models_3d(institution_id);
create index if not exists model_access_logs_institution_started_idx on public.model_access_logs(institution_id, started_at desc);
create index if not exists study_agenda_user_date_idx on public.study_agenda(user_id, date);
create index if not exists platform_events_institution_created_idx on public.platform_events(institution_id, created_at desc);
create index if not exists security_events_institution_created_idx on public.security_events(institution_id, created_at desc);
create index if not exists security_events_user_created_idx on public.security_events(user_id, created_at desc);
create index if not exists security_events_model_created_idx on public.security_events(model_id, created_at desc);

-- Added missing tables based on remote schema sync
create table if not exists public.academic_classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  course text,
  semester text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_class_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.academic_classes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.anatomical_quizzes (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  description text,
  time_limit_seconds integer not null default 300,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anatomical_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  marker_number integer not null,
  correct_answer text not null,
  accepted_answers text[],
  anatomical_description text,
  order_index integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.anatomical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  model_id uuid not null references public.models_3d(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0,
  total_questions integer not null default 10,
  percentage numeric,
  duration_seconds integer,
  status text not null default 'in_progress'
);

create table if not exists public.anatomical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.anatomical_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.anatomical_quiz_questions(id) on delete cascade,
  marker_number integer not null,
  student_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.model_annotations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sketchfab_uid text not null,
  annotation_uid text,
  annotation_index integer not null,
  title text not null,
  description text,
  eye jsonb,
  target jsonb,
  position jsonb,
  images jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null default 'sketchfab',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_anatomical_notes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  model_id uuid references public.models_3d(id) on delete cascade,
  structure text,
  note_type text not null default 'didactic',
  description text not null,
  priority text not null default 'medium',
  status text not null default 'open',
  visibility text not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  scheduled_for timestamptz,
  model_ids jsonb not null default '[]'::jsonb,
  key_structures jsonb not null default '[]'::jsonb,
  objectives jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_study_guides (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  description text,
  objectives jsonb not null default '[]'::jsonb,
  model_ids jsonb not null default '[]'::jsonb,
  due_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
