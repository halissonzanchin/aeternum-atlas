-- Aeternum Atlas - Simulado Anatômico
-- Execute no Supabase SQL Editor.
-- Cria as tabelas oficiais, RLS multi-tenant e um seed inicial a partir das
-- anotações reais já sincronizadas em public.model_annotations.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke usage on schema private from public;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.users where id = (select auth.uid())
$$;

create or replace function private.current_user_status()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select status from public.users where id = (select auth.uid())
$$;

create or replace function private.current_user_institution_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select institution_id from public.users where id = (select auth.uid())
$$;

revoke all on function private.current_user_role() from public;
revoke all on function private.current_user_status() from public;
revoke all on function private.current_user_institution_id() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_status() to authenticated;
grant execute on function private.current_user_institution_id() to authenticated;

create table if not exists public.anatomical_quizzes (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  description text,
  time_limit_seconds integer not null default 300 check (time_limit_seconds between 60 and 7200),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anatomical_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  marker_number integer not null check (marker_number > 0),
  correct_answer text not null,
  accepted_answers text[],
  anatomical_description text,
  order_index integer not null check (order_index >= 0),
  created_at timestamptz not null default now(),
  unique (quiz_id, marker_number),
  unique (quiz_id, order_index)
);

create table if not exists public.anatomical_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.anatomical_quizzes(id) on delete cascade,
  model_id uuid not null references public.models_3d(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score integer not null default 0 check (score >= 0),
  total_questions integer not null default 10 check (total_questions > 0),
  percentage numeric(5,2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'time_expired', 'abandoned'))
);

create table if not exists public.anatomical_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.anatomical_quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.anatomical_quiz_questions(id) on delete cascade,
  marker_number integer not null check (marker_number > 0),
  student_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists anatomical_quizzes_tenant_model_idx
  on public.anatomical_quizzes (institution_id, model_id, active);

create index if not exists anatomical_quiz_questions_quiz_order_idx
  on public.anatomical_quiz_questions (quiz_id, order_index);

create index if not exists anatomical_quiz_attempts_user_created_idx
  on public.anatomical_quiz_attempts (user_id, started_at desc);

create index if not exists anatomical_quiz_attempts_institution_created_idx
  on public.anatomical_quiz_attempts (institution_id, started_at desc);

create index if not exists anatomical_quiz_answers_attempt_idx
  on public.anatomical_quiz_answers (attempt_id);

alter table public.anatomical_quizzes enable row level security;
alter table public.anatomical_quiz_questions enable row level security;
alter table public.anatomical_quiz_attempts enable row level security;
alter table public.anatomical_quiz_answers enable row level security;

grant select on public.anatomical_quizzes to authenticated;
grant select on public.anatomical_quiz_questions to authenticated;
grant select, insert, update on public.anatomical_quiz_attempts to authenticated;
grant select, insert on public.anatomical_quiz_answers to authenticated;

drop policy if exists "anatomical_quizzes_select_by_tenant" on public.anatomical_quizzes;
create policy "anatomical_quizzes_select_by_tenant"
on public.anatomical_quizzes
for select
to authenticated
using (
  active = true
  and (
    (select private.current_user_role()) = 'super_admin'
    or (
      lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
      and institution_id = (select private.current_user_institution_id())
    )
  )
);

drop policy if exists "anatomical_quiz_questions_select_by_tenant" on public.anatomical_quiz_questions;
create policy "anatomical_quiz_questions_select_by_tenant"
on public.anatomical_quiz_questions
for select
to authenticated
using (
  exists (
    select 1
    from public.anatomical_quizzes q
    where q.id = anatomical_quiz_questions.quiz_id
      and q.active = true
      and (
        (select private.current_user_role()) = 'super_admin'
        or (
          lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
          and q.institution_id = (select private.current_user_institution_id())
        )
      )
  )
);

drop policy if exists "anatomical_quiz_attempts_insert_own_tenant" on public.anatomical_quiz_attempts;
create policy "anatomical_quiz_attempts_insert_own_tenant"
on public.anatomical_quiz_attempts
for insert
to authenticated
with check (
  user_id = auth.uid()
  and lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
  and institution_id = (select private.current_user_institution_id())
  and exists (
    select 1
    from public.anatomical_quizzes q
    where q.id = anatomical_quiz_attempts.quiz_id
      and q.model_id = anatomical_quiz_attempts.model_id
      and q.institution_id = anatomical_quiz_attempts.institution_id
      and q.active = true
  )
);

drop policy if exists "anatomical_quiz_attempts_select_by_tenant" on public.anatomical_quiz_attempts;
create policy "anatomical_quiz_attempts_select_by_tenant"
on public.anatomical_quiz_attempts
for select
to authenticated
using (
  user_id = auth.uid()
  or (
    lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
    and (
      (select private.current_user_role()) = 'super_admin'
      or (
        (select private.current_user_role()) in ('teacher', 'institution_admin')
        and institution_id = (select private.current_user_institution_id())
      )
    )
  )
);

drop policy if exists "anatomical_quiz_attempts_update_own_in_progress" on public.anatomical_quiz_attempts;
create policy "anatomical_quiz_attempts_update_own_in_progress"
on public.anatomical_quiz_attempts
for update
to authenticated
using (user_id = auth.uid() and status = 'in_progress')
with check (user_id = auth.uid());

drop policy if exists "anatomical_quiz_answers_insert_own_attempt" on public.anatomical_quiz_answers;
create policy "anatomical_quiz_answers_insert_own_attempt"
on public.anatomical_quiz_answers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.anatomical_quiz_attempts a
    join public.anatomical_quiz_questions q on q.id = anatomical_quiz_answers.question_id
    where a.id = anatomical_quiz_answers.attempt_id
      and a.user_id = auth.uid()
      and q.quiz_id = a.quiz_id
  )
);

drop policy if exists "anatomical_quiz_answers_select_by_attempt_tenant" on public.anatomical_quiz_answers;
create policy "anatomical_quiz_answers_select_by_attempt_tenant"
on public.anatomical_quiz_answers
for select
to authenticated
using (
  exists (
    select 1
    from public.anatomical_quiz_attempts a
    where a.id = anatomical_quiz_answers.attempt_id
      and (
        a.user_id = auth.uid()
        or (
          lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
          and (
            (select private.current_user_role()) = 'super_admin'
            or (
              (select private.current_user_role()) in ('teacher', 'institution_admin')
              and a.institution_id = (select private.current_user_institution_id())
            )
          )
        )
      )
  )
);

do $$
begin
  if to_regclass('public.model_annotations') is not null then
    insert into public.anatomical_quizzes (
      model_id,
      institution_id,
      title,
      description,
      time_limit_seconds,
      active
    )
    select
      m.id,
      m.institution_id,
      'Simulado Anatômico - ' || m.title,
      'Simulado gerado a partir das anotações anatômicas sincronizadas do modelo.',
      300,
      true
    from public.models_3d m
    where m.institution_id is not null
      and exists (
        select 1 from public.model_annotations ma where ma.model_id = m.id
      )
      and not exists (
        select 1
        from public.anatomical_quizzes q
        where q.model_id = m.id
          and q.institution_id = m.institution_id
      );

    with ranked_annotations as (
      select
        q.id as quiz_id,
        ma.title,
        ma.description,
        row_number() over (partition by q.id order by ma.annotation_index asc) as rn
      from public.anatomical_quizzes q
      join public.model_annotations ma on ma.model_id = q.model_id
      where q.active = true
        and not exists (
          select 1
          from public.anatomical_quiz_questions existing
          where existing.quiz_id = q.id
        )
    )
    insert into public.anatomical_quiz_questions (
      quiz_id,
      marker_number,
      correct_answer,
      accepted_answers,
      anatomical_description,
      order_index
    )
    select
      quiz_id,
      rn,
      title,
      array[title],
      description,
      rn - 1
    from ranked_annotations
    where rn <= 10
      and nullif(trim(title), '') is not null;
  end if;
end $$;

commit;

select
  q.id as quiz_id,
  q.title,
  m.slug as model_slug,
  count(qq.id) as questions
from public.anatomical_quizzes q
join public.models_3d m on m.id = q.model_id
left join public.anatomical_quiz_questions qq on qq.quiz_id = q.id
group by q.id, q.title, m.slug
order by q.created_at desc;
