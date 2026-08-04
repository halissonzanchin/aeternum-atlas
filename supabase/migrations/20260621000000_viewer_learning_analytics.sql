-- Aeternum Atlas: viewer learning analytics foundation
-- Stores real, user-owned viewer sessions, interactions and quiz outcomes.

begin;

create table if not exists public.viewer_learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  model_id text not null,
  session_start timestamptz not null default now(),
  session_end timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  interactions_count integer not null default 0 check (interactions_count >= 0),
  annotations_opened integer not null default 0 check (annotations_opened >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (session_end is null or session_end >= session_start)
);

create table if not exists public.viewer_learning_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.viewer_learning_sessions(id) on delete cascade,
  event_type text not null,
  structure_id text,
  annotation_id text,
  quiz_id text,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.viewer_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  model_id text,
  quiz_id text not null,
  correct_answers integer not null default 0 check (correct_answers >= 0),
  incorrect_answers integer not null default 0 check (incorrect_answers >= 0),
  accuracy numeric(5,2) not null default 0 check (accuracy between 0 and 100),
  time_spent integer not null default 0 check (time_spent >= 0),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or completed_at >= started_at)
);

create index if not exists viewer_learning_sessions_user_start_idx
  on public.viewer_learning_sessions (user_id, session_start desc);
create index if not exists viewer_learning_sessions_institution_start_idx
  on public.viewer_learning_sessions (institution_id, session_start desc);
create index if not exists viewer_learning_sessions_model_idx
  on public.viewer_learning_sessions (model_id);
create index if not exists viewer_learning_events_session_created_idx
  on public.viewer_learning_events (session_id, created_at);
create index if not exists viewer_learning_events_type_idx
  on public.viewer_learning_events (event_type);
create index if not exists viewer_quiz_results_user_created_idx
  on public.viewer_quiz_results (user_id, created_at desc);
create index if not exists viewer_quiz_results_institution_created_idx
  on public.viewer_quiz_results (institution_id, created_at desc);
create index if not exists viewer_quiz_results_model_idx
  on public.viewer_quiz_results (model_id);

alter table public.viewer_learning_sessions enable row level security;
alter table public.viewer_learning_events enable row level security;
alter table public.viewer_quiz_results enable row level security;

drop policy if exists "Users can insert their own learning sessions" on public.viewer_learning_sessions;
drop policy if exists "Users can view their own learning sessions" on public.viewer_learning_sessions;
drop policy if exists "Users can update their own learning sessions" on public.viewer_learning_sessions;
drop policy if exists "Staff can view institution learning sessions" on public.viewer_learning_sessions;

create policy "Users can insert their own learning sessions"
on public.viewer_learning_sessions for insert to authenticated
with check (
  auth.uid() = user_id
  and institution_id = public.current_user_institution_id()
);

create policy "Users can view their own learning sessions"
on public.viewer_learning_sessions for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own learning sessions"
on public.viewer_learning_sessions for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and institution_id = public.current_user_institution_id()
);

create policy "Staff can view institution learning sessions"
on public.viewer_learning_sessions for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() in ('admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
    and institution_id = public.current_user_institution_id()
  )
);

drop policy if exists "Users can insert learning events" on public.viewer_learning_events;
drop policy if exists "Users can view their own learning events" on public.viewer_learning_events;
drop policy if exists "Staff can view institution learning events" on public.viewer_learning_events;

create policy "Users can insert learning events"
on public.viewer_learning_events for insert to authenticated
with check (
  exists (
    select 1
    from public.viewer_learning_sessions session
    where session.id = session_id
      and session.user_id = auth.uid()
  )
);

create policy "Users can view their own learning events"
on public.viewer_learning_events for select to authenticated
using (
  exists (
    select 1
    from public.viewer_learning_sessions session
    where session.id = session_id
      and session.user_id = auth.uid()
  )
);

create policy "Staff can view institution learning events"
on public.viewer_learning_events for select to authenticated
using (
  exists (
    select 1
    from public.viewer_learning_sessions session
    where session.id = session_id
      and (
        public.current_user_role() = 'super_admin'
        or (
          public.current_user_role() in ('admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
          and session.institution_id = public.current_user_institution_id()
        )
      )
  )
);

drop policy if exists "Users can insert their own quiz results" on public.viewer_quiz_results;
drop policy if exists "Users can view their own quiz results" on public.viewer_quiz_results;
drop policy if exists "Users can update their own quiz results" on public.viewer_quiz_results;
drop policy if exists "Staff can view institution quiz results" on public.viewer_quiz_results;

create policy "Users can insert their own quiz results"
on public.viewer_quiz_results for insert to authenticated
with check (
  auth.uid() = user_id
  and institution_id = public.current_user_institution_id()
);

create policy "Users can view their own quiz results"
on public.viewer_quiz_results for select to authenticated
using (auth.uid() = user_id);

create policy "Users can update their own quiz results"
on public.viewer_quiz_results for update to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and institution_id = public.current_user_institution_id()
);

create policy "Staff can view institution quiz results"
on public.viewer_quiz_results for select to authenticated
using (
  public.current_user_role() = 'super_admin'
  or (
    public.current_user_role() in ('admin', 'institution_admin', 'rector', 'coordinator', 'teacher')
    and institution_id = public.current_user_institution_id()
  )
);

grant select, insert, update on public.viewer_learning_sessions to authenticated;
grant select, insert on public.viewer_learning_events to authenticated;
grant select, insert, update on public.viewer_quiz_results to authenticated;

commit;
