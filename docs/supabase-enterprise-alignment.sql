-- =========================================================
-- AETERNUM ATLAS - SUPABASE ENTERPRISE ALIGNMENT
-- CORE SEGURO + ANALYTICS + AUTH SYNC
-- =========================================================
-- Objetivo:
-- Alinhar a base atual para SaaS multi-tenant com RLS, FKs,
-- indices, helpers anti-recursao, analytics e sincronizacao Auth.
--
-- Nao executa comandos destrutivos de tabela nem alteracoes
-- que removam dados existentes.
--
-- Ordem recomendada neste arquivo:
-- 1) Rodar BLOCO 1 completo em janela de baixa atividade
-- 2) Conferir WARNING/NOTICE de VALIDATE CONSTRAINT
-- 3) Corrigir dados invalidos se algum VALIDATE emitir WARNING
-- 4) Rodar BLOCO 2
-- 5) Testar login/model_access_logs/views
-- 6) Rodar BLOCO 6 por ultimo, somente depois de revisar signup
--
-- Observacao importante:
-- As constraints NOT VALID passam a proteger NOVOS registros
-- imediatamente, mas dados antigos so ficam 100% validados apos
-- ALTER TABLE ... VALIDATE CONSTRAINT com sucesso.
-- =========================================================

-- =========================================================
-- BLOCO 1: CORE SEGURO PARA RODAR AGORA
-- Inclui constraints, FKs, indices, updated_at, RLS helpers,
-- policies principais, validate constraints e grants basicos.
-- Risco: baixo/moderado. VALIDATE pode avisar sobre dados antigos invalidos.
-- Rollback possivel: remover policies/triggers/constraints individualmente.
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- 1.1 Primary keys seguras quando possivel ----------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'institutions_pkey')
     and not exists (select 1 from public.institutions where id is null)
     and not exists (select id from public.institutions group by id having count(*) > 1) then
    alter table public.institutions add constraint institutions_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'users_pkey')
     and not exists (select 1 from public.users where id is null)
     and not exists (select id from public.users group by id having count(*) > 1) then
    alter table public.users add constraint users_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'student_profiles_pkey')
     and not exists (select 1 from public.student_profiles where user_id is null)
     and not exists (select user_id from public.student_profiles group by user_id having count(*) > 1) then
    alter table public.student_profiles add constraint student_profiles_pkey primary key (user_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teacher_profiles_pkey')
     and not exists (select 1 from public.teacher_profiles where user_id is null)
     and not exists (select user_id from public.teacher_profiles group by user_id having count(*) > 1) then
    alter table public.teacher_profiles add constraint teacher_profiles_pkey primary key (user_id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'audit_logs_pkey')
     and not exists (select 1 from public.audit_logs where id is null)
     and not exists (select id from public.audit_logs group by id having count(*) > 1) then
    alter table public.audit_logs add constraint audit_logs_pkey primary key (id);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_pkey')
     and not exists (select 1 from public.model_access_logs where id is null)
     and not exists (select id from public.model_access_logs group by id having count(*) > 1) then
    alter table public.model_access_logs add constraint model_access_logs_pkey primary key (id);
  end if;
end $$;

-- ---------- 1.2 Uniques sem quebrar dados existentes ----------
do $$
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'users_email_unique_idx' and n.nspname = 'public'
  )
  and not exists (
    select 1 from (
      select lower(email) from public.users where email is not null group by lower(email) having count(*) > 1
    ) duplicates
  ) then
    create unique index users_email_unique_idx on public.users (lower(email)) where email is not null;
  end if;

  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'institutions_slug_unique_idx' and n.nspname = 'public'
  )
  and not exists (
    select 1 from (
      select slug from public.institutions where slug is not null group by slug having count(*) > 1
    ) duplicates
  ) then
    create unique index institutions_slug_unique_idx on public.institutions (slug) where slug is not null;
  end if;
end $$;

-- ---------- 1.3 Foreign keys NOT VALID para migracao segura ----------
do $$
begin
  -- Producao real deve manter public.users.id alinhado com auth.users.id.
  -- Se houver usuarios mockados fora do Auth, o VALIDATE emitira WARNING.
  if not exists (select 1 from pg_constraint where conname = 'users_id_auth_users_fkey') then
    alter table public.users
      add constraint users_id_auth_users_fkey
      foreign key (id) references auth.users(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'users_institution_id_fkey') then
    alter table public.users
      add constraint users_institution_id_fkey
      foreign key (institution_id) references public.institutions(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'student_profiles_user_id_fkey') then
    alter table public.student_profiles
      add constraint student_profiles_user_id_fkey
      foreign key (user_id) references public.users(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'teacher_profiles_user_id_fkey') then
    alter table public.teacher_profiles
      add constraint teacher_profiles_user_id_fkey
      foreign key (user_id) references public.users(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'audit_logs_institution_id_fkey') then
    alter table public.audit_logs
      add constraint audit_logs_institution_id_fkey
      foreign key (institution_id) references public.institutions(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'audit_logs_user_id_fkey') then
    alter table public.audit_logs
      add constraint audit_logs_user_id_fkey
      foreign key (user_id) references public.users(id) on delete set null not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_institution_id_fkey') then
    alter table public.model_access_logs
      add constraint model_access_logs_institution_id_fkey
      foreign key (institution_id) references public.institutions(id) on delete restrict not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_user_id_fkey') then
    alter table public.model_access_logs
      add constraint model_access_logs_user_id_fkey
      foreign key (user_id) references public.users(id) on delete restrict not valid;
  end if;
end $$;

-- ---------- 1.4 CHECK constraints NOT VALID ----------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_role_check') then
    alter table public.users
      add constraint users_role_check
      check (role in ('super_admin', 'institution_admin', 'teacher', 'student', 'researcher')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'users_status_check') then
    alter table public.users
      add constraint users_status_check
      check (status in ('active', 'inactive', 'pending', 'suspended')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_action_check') then
    alter table public.model_access_logs
      add constraint model_access_logs_action_check
      check (action in (
        'view_model', 'favorite_model', 'mark_as_studied', 'open_sketchfab',
        'copy_model_link', 'view_study_guide', 'report_problem',
        'session_start', 'session_end'
      )) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_duration_seconds_check') then
    alter table public.model_access_logs
      add constraint model_access_logs_duration_seconds_check
      check (duration_seconds is null or duration_seconds >= 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'model_access_logs_required_fields_check') then
    alter table public.model_access_logs
      add constraint model_access_logs_required_fields_check
      check (institution_id is not null and user_id is not null and model_id is not null and action is not null) not valid;
  end if;
end $$;

-- ---------- 1.5 Defaults de timestamps/metadados ----------
alter table public.institutions alter column created_at set default now();
alter table public.institutions alter column updated_at set default now();
alter table public.users alter column created_at set default now();
alter table public.users alter column updated_at set default now();
alter table public.audit_logs alter column created_at set default now();
alter table public.model_access_logs alter column created_at set default now();
alter table public.model_access_logs alter column metadata set default '{}'::jsonb;

-- ---------- 1.6 Indices essenciais ----------
create index if not exists users_institution_id_idx on public.users (institution_id);
create index if not exists users_role_idx on public.users (role);
create index if not exists users_status_idx on public.users (status);
create index if not exists users_email_idx on public.users (email);
create index if not exists student_profiles_user_id_idx on public.student_profiles (user_id);
create index if not exists teacher_profiles_user_id_idx on public.teacher_profiles (user_id);
create index if not exists model_access_logs_institution_id_idx on public.model_access_logs (institution_id);
create index if not exists model_access_logs_user_id_idx on public.model_access_logs (user_id);
create index if not exists model_access_logs_model_id_idx on public.model_access_logs (model_id);
create index if not exists model_access_logs_action_idx on public.model_access_logs (action);
create index if not exists model_access_logs_created_at_idx on public.model_access_logs (created_at desc);
create index if not exists audit_logs_institution_id_idx on public.audit_logs (institution_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);

-- ---------- 1.7 Trigger updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_institutions') then
    create trigger set_updated_at_on_institutions
    before update on public.institutions
    for each row execute function public.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'set_updated_at_on_users') then
    create trigger set_updated_at_on_users
    before update on public.users
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- ---------- 1.8 Helpers RLS anti-recursao ----------
-- Security definer fica no schema private para evitar exposicao via API.
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

-- ---------- 1.8B Protecao contra escalada de privilegio ----------
-- RLS nao protege colunas individualmente. Este trigger impede que
-- usuarios autenticados mudem role/status/institution_id/email via perfil.
-- Alteracoes sensiveis devem ocorrer por SQL admin ou Edge Function segura.
create or replace function private.protect_users_sensitive_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.institution_id is distinct from old.institution_id
     or new.email is distinct from old.email then
    raise exception 'Sensitive user fields cannot be changed directly by authenticated clients';
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'protect_users_sensitive_columns') then
    create trigger protect_users_sensitive_columns
    before update on public.users
    for each row execute function private.protect_users_sensitive_columns();
  end if;
end $$;

-- ---------- 1.9 RLS principal ----------
alter table public.institutions enable row level security;
alter table public.users enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.model_access_logs enable row level security;

drop policy if exists "institutions_select_by_tenant" on public.institutions;
create policy "institutions_select_by_tenant"
on public.institutions
for select
to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
);

drop policy if exists "users_select_by_tenant_or_self" on public.users;
create policy "users_select_by_tenant_or_self"
on public.users
for select
to authenticated
using (
  id = (select auth.uid())
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) in ('institution_admin', 'teacher')
  )
);

drop policy if exists "users_update_self_or_admin" on public.users;
drop policy if exists "users_update_self_limited" on public.users;
create policy "users_update_self_limited"
on public.users
for update
to authenticated
using (
  id = (select auth.uid())
  and (select private.current_user_status()) in ('active', 'pending')
)
with check (
  id = (select auth.uid())
  and institution_id is not distinct from (select private.current_user_institution_id())
);

drop policy if exists "student_profiles_select_by_tenant" on public.student_profiles;
create policy "student_profiles_select_by_tenant"
on public.student_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and (select private.current_user_role()) in ('institution_admin', 'teacher')
    and exists (
      select 1 from public.users u
      where u.id = student_profiles.user_id
        and u.institution_id = (select private.current_user_institution_id())
    )
  )
);

drop policy if exists "teacher_profiles_select_by_tenant" on public.teacher_profiles;
create policy "teacher_profiles_select_by_tenant"
on public.teacher_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and (select private.current_user_role()) = 'institution_admin'
    and exists (
      select 1 from public.users u
      where u.id = teacher_profiles.user_id
        and u.institution_id = (select private.current_user_institution_id())
    )
  )
);

drop policy if exists "audit_logs_select_by_tenant" on public.audit_logs;
create policy "audit_logs_select_by_tenant"
on public.audit_logs
for select
to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) = 'institution_admin'
  )
);

drop policy if exists "audit_logs_insert_own_tenant" on public.audit_logs;
create policy "audit_logs_insert_own_tenant"
on public.audit_logs
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

drop policy if exists "model_access_logs_select_by_tenant" on public.model_access_logs;
create policy "model_access_logs_select_by_tenant"
on public.model_access_logs
for select
to authenticated
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

drop policy if exists "model_access_logs_insert_own_tenant" on public.model_access_logs;
create policy "model_access_logs_insert_own_tenant"
on public.model_access_logs
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select private.current_user_status()) = 'active'
  and user_id = (select auth.uid())
  and institution_id = (select private.current_user_institution_id())
);

-- ---------- 1.10 VALIDATE CONSTRAINTS ----------
-- Se houver dado antigo invalido, emite WARNING e continua.
-- Recomendacao: corrija o dado antigo e rode VALIDATE novamente.
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('public.users', 'users_id_auth_users_fkey'),
      ('public.users', 'users_institution_id_fkey'),
      ('public.student_profiles', 'student_profiles_user_id_fkey'),
      ('public.teacher_profiles', 'teacher_profiles_user_id_fkey'),
      ('public.audit_logs', 'audit_logs_institution_id_fkey'),
      ('public.audit_logs', 'audit_logs_user_id_fkey'),
      ('public.model_access_logs', 'model_access_logs_institution_id_fkey'),
      ('public.model_access_logs', 'model_access_logs_user_id_fkey'),
      ('public.users', 'users_role_check'),
      ('public.users', 'users_status_check'),
      ('public.model_access_logs', 'model_access_logs_action_check'),
      ('public.model_access_logs', 'model_access_logs_duration_seconds_check'),
      ('public.model_access_logs', 'model_access_logs_required_fields_check')
    ) as v(table_name, constraint_name)
  loop
    if exists (select 1 from pg_constraint where conname = item.constraint_name) then
      begin
        execute format('alter table %s validate constraint %I', item.table_name, item.constraint_name);
        raise notice 'Validated constraint: %', item.constraint_name;
      exception when others then
        raise warning 'Could not validate constraint %. Fix existing data and run VALIDATE again. Error: %', item.constraint_name, sqlerrm;
      end;
    end if;
  end loop;
end $$;

-- =========================================================
-- BLOCO 2: ANALYTICS
-- Views com security_invoker para respeitar RLS das tabelas base.
-- Risco: baixo em Supabase Cloud/PostgreSQL 15+.
-- =========================================================

create or replace view public.institution_usage_summary
with (security_invoker = true)
as
select
  institution_id,
  count(*)::bigint as total_events,
  count(*) filter (where action = 'view_model')::bigint as total_model_views,
  count(distinct user_id)::bigint as unique_users,
  coalesce(sum(duration_seconds), 0)::bigint as total_study_seconds,
  coalesce(avg(duration_seconds), 0)::numeric(12,2) as avg_duration_seconds,
  max(created_at) as last_event_at
from public.model_access_logs
group by institution_id;

create or replace view public.model_popularity_summary
with (security_invoker = true)
as
select
  institution_id,
  model_id,
  count(*) filter (where action = 'view_model')::bigint as total_views,
  count(distinct user_id)::bigint as unique_users,
  coalesce(avg(duration_seconds), 0)::numeric(12,2) as avg_duration_seconds,
  max(created_at) filter (where action = 'view_model') as last_view_at
from public.model_access_logs
group by institution_id, model_id;

create or replace view public.user_engagement_summary
with (security_invoker = true)
as
select
  institution_id,
  user_id,
  count(*)::bigint as total_events,
  count(*) filter (where action = 'view_model')::bigint as total_views,
  coalesce(sum(duration_seconds), 0)::bigint as total_study_seconds,
  max(created_at) as last_access_at
from public.model_access_logs
group by institution_id, user_id;

grant select on
  public.institution_usage_summary,
  public.model_popularity_summary,
  public.user_engagement_summary
to authenticated;

-- =========================================================
-- BLOCO 6: AUTH SYNC
-- RODAR POR ULTIMO.
-- Cria registro em public.users quando usuario nasce em auth.users.
-- Risco: moderado/alto. Se houver erro aqui, o signup pode falhar.
--
-- institution_id:
-- - preferencialmente vindo de raw_app_meta_data
-- - fallback de raw_user_meta_data aceito apenas como pending
-- - sempre validado contra public.institutions
--
-- role default: student
-- status default: pending
-- Aprovacao institucional deve ativar status por fluxo admin/Edge Function.
-- =========================================================

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_institution_text text;
  requested_institution_id uuid;
begin
  requested_institution_text := coalesce(
    nullif(new.raw_app_meta_data->>'institution_id', ''),
    nullif(new.raw_user_meta_data->>'institution_id', '')
  );

  begin
    requested_institution_id := requested_institution_text::uuid;
  exception when invalid_text_representation then
    requested_institution_id := null;
  end;

  if requested_institution_id is not null
     and not exists (select 1 from public.institutions where id = requested_institution_id) then
    requested_institution_id := null;
  end if;

  insert into public.users (
    id, institution_id, name, email, role, status, avatar_url, last_login, created_at, updated_at
  )
  values (
    new.id,
    requested_institution_id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    'student',
    'pending',
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    null,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.users.name, excluded.name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- =========================================================
-- ANEXO A: TESTES SQL SEGUROS POS-EXECUCAO
-- Nao sao executados automaticamente por este arquivo.
-- Copie e rode manualmente depois, substituindo os placeholders.
-- =========================================================
-- 1) Constraints ainda nao validadas:
-- select conrelid::regclass as table_name, conname, convalidated
-- from pg_constraint
-- where conrelid::regclass::text in (
--   'public.users', 'public.student_profiles', 'public.teacher_profiles',
--   'public.audit_logs', 'public.model_access_logs'
-- )
-- and convalidated = false;
--
-- 2) Usuarios public.users sem auth.users:
-- select u.id, u.email from public.users u
-- left join auth.users au on au.id = u.id
-- where au.id is null;
--
-- 3) Usuarios sem institution_id:
-- select id, email, role, status from public.users where institution_id is null;
--
-- 4) Logs orfaos:
-- select l.id from public.model_access_logs l
-- left join public.users u on u.id = l.user_id
-- left join public.institutions i on i.id = l.institution_id
-- where u.id is null or i.id is null;
--
-- 5) Simular RLS de leitura em transacao com rollback:
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<USER_UUID>';
-- select auth.uid();
-- select * from public.model_access_logs limit 10;
-- rollback;
--
-- 6) Simular insert de log com rollback:
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<ACTIVE_USER_UUID>';
-- insert into public.model_access_logs (
--   institution_id, user_id, model_id, action, duration_seconds, metadata
-- ) values (
--   '<USER_INSTITUTION_UUID>', '<ACTIVE_USER_UUID>', '<MODEL_UUID>',
--   'view_model', 0, '{}'::jsonb
-- ) returning *;
-- rollback;
