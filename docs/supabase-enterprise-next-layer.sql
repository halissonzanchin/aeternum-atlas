-- =========================================================
-- AETERNUM ATLAS - SUPABASE ENTERPRISE NEXT LAYER
-- EXPANSOES SAAS + RBAC + STORAGE + EDGE FUNCTIONS FUTURAS
-- =========================================================
-- Pre-requisito: rode primeiro docs/supabase-enterprise-alignment.sql
-- e valide login, model_access_logs e analytics.
--
-- Este arquivo nao executa comandos destrutivos de tabela nem
-- alteracoes que removam dados existentes.
--
-- Policies antigas sao removidas apenas com DROP POLICY IF EXISTS.
--
-- Ordem recomendada neste arquivo:
-- 1) BLOCO 3 - Expansoes SaaS
-- 2) Testar tabelas novas e RLS basica
-- 3) BLOCO 4 - RBAC
-- 4) Testar permissoes por role
-- 5) BLOCO 5A - Buckets Storage
-- 6) BLOCO 5B - Policies Storage somente com path:
--    <institution_id>/<tipo>/<arquivo>
-- 7) BLOCO 7 - apenas leitura/documentacao
-- =========================================================

-- =========================================================
-- BLOCO 3: EXPANSOES SAAS
-- Cria tabelas futuras essenciais para produto institucional.
-- Risco: moderado. Cria objetos novos, mas nao altera dados existentes.
-- Exige que private.current_user_role/status/institution_id existam.
-- =========================================================

create table if not exists public.favorite_models (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  model_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, model_id)
);

create table if not exists public.model_annotations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  model_id uuid not null,
  annotation text not null,
  position jsonb not null default '{}'::jsonb,
  visibility text not null default 'private' check (visibility in ('private', 'institution', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  model_id uuid null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  plan text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending', 'suspended', 'cancelled')),
  max_students integer not null default 0,
  price_per_student numeric(12,2) not null default 0,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'semester', 'annual')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete restrict,
  user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  event_category text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Camada operacional docente.
-- Estas tabelas habilitam turmas, vínculos aluno-turma,
-- guias de estudo, planos de aula e anotações anatômicas.
create table if not exists public.academic_classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  teacher_id uuid not null references public.users(id) on delete restrict,
  name text not null,
  course text,
  semester text,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_class_students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  class_id uuid not null references public.academic_classes(id) on delete restrict,
  student_id uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.teacher_study_guides (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  teacher_id uuid not null references public.users(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  description text,
  objectives jsonb not null default '[]'::jsonb,
  model_ids jsonb not null default '[]'::jsonb,
  due_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_lesson_plans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  teacher_id uuid not null references public.users(id) on delete restrict,
  class_id uuid references public.academic_classes(id) on delete set null,
  title text not null,
  scheduled_for timestamptz,
  model_ids jsonb not null default '[]'::jsonb,
  key_structures jsonb not null default '[]'::jsonb,
  objectives jsonb not null default '[]'::jsonb,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'delivered', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_anatomical_notes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  teacher_id uuid not null references public.users(id) on delete restrict,
  model_id uuid,
  structure text,
  note_type text not null default 'didactic' check (note_type in ('correction', 'didactic', 'clinical', 'legend', 'annotation')),
  description text not null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'institution', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists favorite_models_institution_user_idx on public.favorite_models (institution_id, user_id);
create index if not exists favorite_models_model_id_idx on public.favorite_models (model_id);
create index if not exists model_annotations_institution_model_idx on public.model_annotations (institution_id, model_id);
create index if not exists model_annotations_user_id_idx on public.model_annotations (user_id);
create index if not exists study_sessions_institution_user_idx on public.study_sessions (institution_id, user_id);
create index if not exists study_sessions_model_id_idx on public.study_sessions (model_id);
create index if not exists subscriptions_institution_idx on public.subscriptions (institution_id);
create index if not exists platform_events_institution_created_idx on public.platform_events (institution_id, created_at desc);
create index if not exists platform_events_user_created_idx on public.platform_events (user_id, created_at desc);
create index if not exists platform_events_event_type_idx on public.platform_events (event_type);
create index if not exists academic_classes_institution_teacher_idx on public.academic_classes (institution_id, teacher_id);
create index if not exists academic_classes_status_idx on public.academic_classes (status);
create index if not exists academic_class_students_class_idx on public.academic_class_students (class_id);
create index if not exists academic_class_students_student_idx on public.academic_class_students (student_id);
create index if not exists teacher_study_guides_institution_teacher_idx on public.teacher_study_guides (institution_id, teacher_id);
create index if not exists teacher_study_guides_class_idx on public.teacher_study_guides (class_id);
create index if not exists teacher_lesson_plans_institution_teacher_idx on public.teacher_lesson_plans (institution_id, teacher_id);
create index if not exists teacher_lesson_plans_class_idx on public.teacher_lesson_plans (class_id);
create index if not exists teacher_anatomical_notes_institution_teacher_idx on public.teacher_anatomical_notes (institution_id, teacher_id);
create index if not exists teacher_anatomical_notes_status_idx on public.teacher_anatomical_notes (status);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_model_annotations') then
    create trigger set_updated_at_on_model_annotations
    before update on public.model_annotations
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_subscriptions') then
    create trigger set_updated_at_on_subscriptions
    before update on public.subscriptions
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_academic_classes') then
    create trigger set_updated_at_on_academic_classes
    before update on public.academic_classes
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_teacher_study_guides') then
    create trigger set_updated_at_on_teacher_study_guides
    before update on public.teacher_study_guides
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_teacher_lesson_plans') then
    create trigger set_updated_at_on_teacher_lesson_plans
    before update on public.teacher_lesson_plans
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_teacher_anatomical_notes') then
    create trigger set_updated_at_on_teacher_anatomical_notes
    before update on public.teacher_anatomical_notes
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.favorite_models enable row level security;
alter table public.model_annotations enable row level security;
alter table public.study_sessions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.platform_events enable row level security;
alter table public.academic_classes enable row level security;
alter table public.academic_class_students enable row level security;
alter table public.teacher_study_guides enable row level security;
alter table public.teacher_lesson_plans enable row level security;
alter table public.teacher_anatomical_notes enable row level security;

drop policy if exists "favorite_models_select_by_tenant" on public.favorite_models;
create policy "favorite_models_select_by_tenant" on public.favorite_models
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
  )
);

drop policy if exists "favorite_models_insert_own" on public.favorite_models;
create policy "favorite_models_insert_own" on public.favorite_models
for insert to authenticated
with check (
  (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "favorite_models_delete_own" on public.favorite_models;
create policy "favorite_models_delete_own" on public.favorite_models
for delete to authenticated
using (
  (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
);

drop policy if exists "model_annotations_select_by_visibility" on public.model_annotations;
create policy "model_annotations_select_by_visibility" on public.model_annotations
for select to authenticated
using (
  (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and visibility in ('institution', 'public')
    and institution_id = (select private.current_user_institution_id())
  )
);

drop policy if exists "model_annotations_insert_own" on public.model_annotations;
create policy "model_annotations_insert_own" on public.model_annotations
for insert to authenticated
with check (
  (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "model_annotations_update_own" on public.model_annotations;
create policy "model_annotations_update_own" on public.model_annotations
for update to authenticated
using (
  (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
)
with check (
  (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
  )
  or (select private.current_user_role()) = 'super_admin'
);

drop policy if exists "study_sessions_select_by_tenant" on public.study_sessions;
create policy "study_sessions_select_by_tenant" on public.study_sessions
for select to authenticated
using (
  (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) in ('institution_admin', 'teacher')
  )
);

drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own" on public.study_sessions
for insert to authenticated
with check (
  (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "subscriptions_select_admin" on public.subscriptions;
create policy "subscriptions_select_admin" on public.subscriptions
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
);

drop policy if exists "platform_events_select_by_tenant" on public.platform_events;
create policy "platform_events_select_by_tenant" on public.platform_events
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) in ('institution_admin', 'teacher')
  )
  or (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
);

drop policy if exists "platform_events_insert_own_tenant" on public.platform_events;
create policy "platform_events_insert_own_tenant" on public.platform_events
for insert to authenticated
with check (
  (select auth.uid()) is not null
  and (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "academic_classes_select_scoped" on public.academic_classes;
create policy "academic_classes_select_scoped"
on public.academic_classes
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "academic_classes_manage_scoped" on public.academic_classes;
create policy "academic_classes_manage_scoped"
on public.academic_classes
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "academic_class_students_select_scoped" on public.academic_class_students;
create policy "academic_class_students_select_scoped"
on public.academic_class_students
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      (select private.current_user_role()) = 'institution_admin'
      or exists (
        select 1
        from public.academic_classes c
        where c.id = academic_class_students.class_id
          and c.teacher_id = (select auth.uid())
          and c.institution_id = academic_class_students.institution_id
      )
    )
  )
);

drop policy if exists "academic_class_students_manage_scoped" on public.academic_class_students;
create policy "academic_class_students_manage_scoped"
on public.academic_class_students
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      (select private.current_user_role()) = 'institution_admin'
      or exists (
        select 1
        from public.academic_classes c
        where c.id = academic_class_students.class_id
          and c.teacher_id = (select auth.uid())
          and c.institution_id = academic_class_students.institution_id
      )
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      (select private.current_user_role()) = 'institution_admin'
      or exists (
        select 1
        from public.academic_classes c
        where c.id = academic_class_students.class_id
          and c.teacher_id = (select auth.uid())
          and c.institution_id = academic_class_students.institution_id
      )
    )
  )
);

drop policy if exists "teacher_study_guides_select_scoped" on public.teacher_study_guides;
create policy "teacher_study_guides_select_scoped"
on public.teacher_study_guides
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "teacher_study_guides_manage_scoped" on public.teacher_study_guides;
create policy "teacher_study_guides_manage_scoped"
on public.teacher_study_guides
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "teacher_lesson_plans_select_scoped" on public.teacher_lesson_plans;
create policy "teacher_lesson_plans_select_scoped"
on public.teacher_lesson_plans
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "teacher_lesson_plans_manage_scoped" on public.teacher_lesson_plans;
create policy "teacher_lesson_plans_manage_scoped"
on public.teacher_lesson_plans
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "teacher_anatomical_notes_select_scoped" on public.teacher_anatomical_notes;
create policy "teacher_anatomical_notes_select_scoped"
on public.teacher_anatomical_notes
for select to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
      or visibility = 'institution'
    )
  )
);

drop policy if exists "teacher_anatomical_notes_manage_scoped" on public.teacher_anatomical_notes;
create policy "teacher_anatomical_notes_manage_scoped"
on public.teacher_anatomical_notes
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (
      teacher_id = (select auth.uid())
      or (select private.current_user_role()) = 'institution_admin'
    )
  )
);

grant select, insert, update, delete on
  public.academic_classes,
  public.academic_class_students,
  public.teacher_study_guides,
  public.teacher_lesson_plans,
  public.teacher_anatomical_notes
to authenticated;

-- =========================================================
-- BLOCO 4: RBAC
-- Cria permissoes granulares para evoluir alem de role simples.
-- Risco: moderado. Seguro para criar, mas a aplicacao precisa passar
-- a consultar essas tabelas antes de depender delas.
-- =========================================================

create table if not exists public.permissions (
  id text primary key,
  description text not null,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role text not null check (role in ('super_admin', 'institution_admin', 'teacher', 'student', 'researcher')),
  permission_id text not null references public.permissions(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (role, permission_id)
);

create table if not exists public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  permission_id text not null references public.permissions(id) on delete restrict,
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, permission_id)
);

insert into public.permissions (id, description, category) values
  ('can_export_reports', 'Pode exportar relatorios academicos e institucionais', 'reports'),
  ('can_manage_students', 'Pode gerenciar alunos da instituicao', 'institution'),
  ('can_manage_teachers', 'Pode gerenciar professores da instituicao', 'institution'),
  ('can_upload_models', 'Pode enviar ou atualizar modelos anatomicos', 'models'),
  ('can_view_financial_dashboard', 'Pode acessar dashboard financeiro institucional', 'billing'),
  ('can_view_global_analytics', 'Pode acessar analytics globais SaaS', 'analytics'),
  ('can_manage_subscriptions', 'Pode gerenciar assinatura institucional', 'billing'),
  ('can_create_study_guides', 'Pode criar guias de estudo', 'academic'),
  ('can_view_class_reports', 'Pode ver relatorios de turmas', 'academic')
on conflict (id) do nothing;

insert into public.role_permissions (role, permission_id) values
  ('super_admin', 'can_export_reports'),
  ('super_admin', 'can_manage_students'),
  ('super_admin', 'can_manage_teachers'),
  ('super_admin', 'can_upload_models'),
  ('super_admin', 'can_view_financial_dashboard'),
  ('super_admin', 'can_view_global_analytics'),
  ('super_admin', 'can_manage_subscriptions'),
  ('super_admin', 'can_create_study_guides'),
  ('super_admin', 'can_view_class_reports'),
  ('institution_admin', 'can_export_reports'),
  ('institution_admin', 'can_manage_students'),
  ('institution_admin', 'can_manage_teachers'),
  ('institution_admin', 'can_view_financial_dashboard'),
  ('institution_admin', 'can_manage_subscriptions'),
  ('teacher', 'can_create_study_guides'),
  ('teacher', 'can_view_class_reports')
on conflict (role, permission_id) do nothing;

create index if not exists user_permissions_institution_user_idx on public.user_permissions (institution_id, user_id);
create index if not exists user_permissions_permission_idx on public.user_permissions (permission_id);

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_permissions enable row level security;

drop policy if exists "permissions_select_authenticated" on public.permissions;
create policy "permissions_select_authenticated" on public.permissions
for select to authenticated
using ((select private.current_user_status()) = 'active' or (select private.current_user_role()) = 'super_admin');

drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
create policy "role_permissions_select_authenticated" on public.role_permissions
for select to authenticated
using ((select private.current_user_status()) = 'active' or (select private.current_user_role()) = 'super_admin');

drop policy if exists "user_permissions_select_by_tenant" on public.user_permissions;
create policy "user_permissions_select_by_tenant" on public.user_permissions
for select to authenticated
using (
  (
    (select private.current_user_status()) = 'active'
    and user_id = (select auth.uid())
  )
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
);

drop policy if exists "user_permissions_admin_manage" on public.user_permissions;
create policy "user_permissions_admin_manage" on public.user_permissions
for all to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
    and permission_id not in (
      'can_view_global_analytics',
      'can_manage_subscriptions',
      'can_view_financial_dashboard'
    )
  )
)
with check (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
    and permission_id not in (
      'can_view_global_analytics',
      'can_manage_subscriptions',
      'can_view_financial_dashboard'
    )
  )
);

grant select on public.permissions, public.role_permissions, public.user_permissions to authenticated;

-- =========================================================
-- BLOCO 5: STORAGE
-- 5A cria buckets recomendados.
-- 5B cria policies em storage.objects.
-- Risco: moderado/alto. Rode 5B somente se adotar path:
-- <institution_id>/<tipo>/<arquivo>
-- Exemplo: 11111111-1111-4111-8111-111111111111/models/coracao.glb
--
-- Observacao: upsert em Storage precisa de SELECT + INSERT + UPDATE.
-- As policies abaixo permitem insert academico para professor/admin,
-- mas substituicao de arquivo fica limitada a institution_admin/super_admin.
-- =========================================================

-- ---------- 5A: Buckets recomendados ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('aeternum-model-assets', 'aeternum-model-assets', false, 524288000, array['image/png','image/jpeg','image/webp','model/gltf-binary','model/gltf+json','application/octet-stream']::text[]),
  ('aeternum-study-guides', 'aeternum-study-guides', false, 52428800, array['application/pdf','image/png','image/jpeg','text/plain']::text[]),
  ('aeternum-reports', 'aeternum-reports', false, 104857600, array['application/pdf','text/csv','application/json']::text[]),
  ('aeternum-annotations', 'aeternum-annotations', false, 52428800, array['image/png','image/jpeg','application/json','text/plain']::text[])
on conflict (id) do nothing;

-- ---------- 5B: Policies em storage.objects ----------
drop policy if exists "aeternum_storage_select_by_tenant" on storage.objects;
drop policy if exists "aeternum_storage_select_academic_by_tenant" on storage.objects;
create policy "aeternum_storage_select_academic_by_tenant"
on storage.objects
for select
to authenticated
using (
  bucket_id in ('aeternum-model-assets', 'aeternum-study-guides', 'aeternum-annotations')
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
    )
  )
);

drop policy if exists "aeternum_storage_select_reports_admin" on storage.objects;
create policy "aeternum_storage_select_reports_admin"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'aeternum-reports'
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "aeternum_storage_insert_academic_assets" on storage.objects;
create policy "aeternum_storage_insert_academic_assets"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('aeternum-model-assets', 'aeternum-study-guides', 'aeternum-annotations')
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) in ('teacher', 'institution_admin')
    )
  )
);

drop policy if exists "aeternum_storage_insert_reports" on storage.objects;
create policy "aeternum_storage_insert_reports"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'aeternum-reports'
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "aeternum_storage_update_admin" on storage.objects;
create policy "aeternum_storage_update_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('aeternum-model-assets', 'aeternum-study-guides', 'aeternum-reports', 'aeternum-annotations')
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) = 'institution_admin'
    )
  )
)
with check (
  bucket_id in ('aeternum-model-assets', 'aeternum-study-guides', 'aeternum-reports', 'aeternum-annotations')
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) = 'institution_admin'
    )
  )
);

drop policy if exists "aeternum_storage_delete_admin" on storage.objects;
create policy "aeternum_storage_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('aeternum-model-assets', 'aeternum-study-guides', 'aeternum-reports', 'aeternum-annotations')
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      (select private.current_user_status()) = 'active'
      and (storage.foldername(name))[1] = (select private.current_user_institution_id())::text
      and (select private.current_user_role()) = 'institution_admin'
    )
  )
);

-- =========================================================
-- BLOCO 7: EDGE FUNCTIONS FUTURAS
-- Apenas documentacao. Nao executa objetos.
-- =========================================================
-- Futuras Edge Functions recomendadas:
-- 1. billing-calculate-institution-cycle
--    Calcula faturamento por capacidade, alunos cadastrados ou ativos.
-- 2. billing-stripe-webhook
--    Recebe eventos Stripe e atualiza subscriptions/audit_logs.
-- 3. invite-institution-user
--    Convite seguro de alunos/professores/admins com institution_id controlado.
-- 4. approve-pending-user
--    Aprova usuario pending, define role/status e grava audit trail.
-- 5. sketchfab-webhook-ingest
--    Recebe eventos externos/metadata de modelos.
-- 6. analytics-aggregate-nightly
--    Agrega logs brutos em tabelas de resumo para dashboards rapidos.
-- 7. export-executive-report
--    Gera PDF/CSV institucional sem expor service_role no frontend.
-- 8. audit-trail-event
--    Registra eventos sensiveis com ip/user-agent no servidor.
