-- =========================================================
-- AETERNUM ATLAS - SECURITY EVENTS / PROTECTED CONTENT AUDIT
-- =========================================================
-- Execute este arquivo no Supabase SQL Editor.
--
-- Objetivo:
-- - Registrar tentativas de captura, atalhos suspeitos, perda de foco e
--   outros eventos de seguranca em conteudos anatomicos protegidos.
-- - Manter RLS multi-tenant: aluno insere/consulta eventos proprios,
--   admin institucional consulta eventos da propria instituicao,
--   super_admin consulta todos.
--
-- Observacao:
-- Nenhuma protecao web bloqueia 100% capturas externas. Esta tabela existe
-- para rastreabilidade, auditoria institucional e mitigacao de vazamentos.
-- =========================================================

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

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'printscreen_attempt',
      'devtools_attempt',
      'right_click_blocked',
      'tab_blur',
      'screen_recording_suspected',
      'unauthorized_share_suspected',
      'shortcut_blocked',
      'policy_accepted'
    )
  ),
  model_id uuid references public.models_3d(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists security_events_institution_created_idx
  on public.security_events (institution_id, created_at desc);

create index if not exists security_events_user_created_idx
  on public.security_events (user_id, created_at desc);

create index if not exists security_events_model_created_idx
  on public.security_events (model_id, created_at desc);

create index if not exists security_events_event_type_created_idx
  on public.security_events (event_type, created_at desc);

alter table public.security_events enable row level security;

revoke all on public.security_events from anon;
grant insert, select on public.security_events to authenticated;

drop policy if exists "security_events_insert_own_event" on public.security_events;
create policy "security_events_insert_own_event"
on public.security_events
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
  and (
    institution_id is null
    or institution_id = (select private.current_user_institution_id())
    or (select private.current_user_role()) = 'super_admin'
  )
);

drop policy if exists "security_events_select_own_event" on public.security_events;
create policy "security_events_select_own_event"
on public.security_events
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "security_events_select_institution_admin" on public.security_events;
create policy "security_events_select_institution_admin"
on public.security_events
for select
to authenticated
using (
  lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
  and (select private.current_user_role()) = 'institution_admin'
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "security_events_select_super_admin" on public.security_events;
create policy "security_events_select_super_admin"
on public.security_events
for select
to authenticated
using (
  lower(coalesce((select private.current_user_status()), 'active')) in ('active', 'ativo')
  and (select private.current_user_role()) = 'super_admin'
);

comment on table public.security_events is
  'Audit trail for protected-content security events in Aeternum Atlas.';

comment on column public.security_events.event_type is
  'Examples: printscreen_attempt, devtools_attempt, right_click_blocked, tab_blur, screen_recording_suspected, unauthorized_share_suspected.';

commit;

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'security_events';
