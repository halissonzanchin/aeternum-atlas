create table if not exists public.vita_tutor_memory (
  user_id uuid not null references auth.users(id) on delete cascade,
  tutor_id text not null check (tutor_id in ('eduardo', 'antonia', 'ariana', 'fabian')),
  current_topic text check (char_length(current_topic) <= 160),
  previous_topics text[] not null default '{}',
  mastery_evidence integer not null default 0 check (mastery_evidence >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, tutor_id),
  check (cardinality(previous_topics) <= 5)
);

alter table public.vita_tutor_memory enable row level security;

revoke insert, update, delete on table public.vita_tutor_memory from anon, authenticated;
grant select on table public.vita_tutor_memory to authenticated;
grant all on table public.vita_tutor_memory to service_role;

drop policy if exists "vita_memory_select_own" on public.vita_tutor_memory;
create policy "vita_memory_select_own"
on public.vita_tutor_memory
for select
to authenticated
using ((select auth.uid()) = user_id);

comment on table public.vita_tutor_memory is
  'Bounded cross-session pedagogical memory owned exclusively by Aeternum Vita.';
