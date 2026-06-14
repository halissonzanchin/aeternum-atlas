-- =========================================================
-- AETERNUM ATLAS - ENTERPRISE SECURITY VALIDATION
-- =========================================================
-- Objetivo:
-- Validar isolamento multi-tenant, RLS, consistencia auth/public.users,
-- auditoria por instituicao e logs por usuario.
--
-- Este arquivo e seguro: nao usa DROP, TRUNCATE, DELETE ou UPDATE.
-- Os blocos de simulacao usam transacao com ROLLBACK.
--
-- Ordem recomendada:
-- 1) Rodar BLOCO 1 para encontrar problemas de tenant.
-- 2) Rodar BLOCO 2 para validar RLS ligado e policies existentes.
-- 3) Rodar BLOCO 3 para validar consistencia auth.users/public.users.
-- 4) Rodar BLOCO 4 para validar logs e auditoria.
-- 5) Rodar BLOCO 5 manualmente, substituindo placeholders.
-- =========================================================

begin read only;

-- =========================================================
-- BLOCO 1: DIAGNOSTICO MULTI-TENANT
-- =========================================================

-- 1.1 Usuarios institucionais sem tenant.
select
  id,
  email,
  role,
  status,
  institution_id,
  created_at
from public.users
where role in ('student', 'teacher', 'institution_admin')
  and institution_id is null
order by created_at desc;

-- 1.2 Usuarios com tenant inexistente.
select
  u.id,
  u.email,
  u.role,
  u.status,
  u.institution_id
from public.users u
left join public.institutions i on i.id = u.institution_id
where u.institution_id is not null
  and i.id is null
order by u.created_at desc;

-- 1.2B Cadastros pendentes vinculados a instituicao inativa.
select
  u.id,
  u.email,
  u.role,
  u.status,
  u.institution_id,
  i.slug as tenant,
  i.active,
  i.contract_status
from public.users u
join public.institutions i on i.id = u.institution_id
where u.status = 'pending'
  and u.role = 'student'
  and (i.active is distinct from true or coalesce(i.contract_status, 'active') not in ('active', 'ativo', 'Ativa'))
order by u.created_at desc;

-- 1.3 Roles ou status fora do padrao enterprise.
select
  id,
  email,
  role,
  status
from public.users
where role not in ('super_admin', 'institution_admin', 'teacher', 'student', 'researcher')
   or status not in ('active', 'inactive', 'pending', 'suspended')
order by created_at desc;

-- 1.4 Distribuicao por tenant/role/status.
select
  coalesce(i.slug, 'sem-tenant') as tenant,
  u.role,
  u.status,
  count(*) as total
from public.users u
left join public.institutions i on i.id = u.institution_id
group by coalesce(i.slug, 'sem-tenant'), u.role, u.status
order by tenant, u.role, u.status;

-- =========================================================
-- BLOCO 2: RLS E POLICIES
-- =========================================================

-- 2.1 Tabelas criticas com RLS.
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public'
  and tablename in (
    'institutions',
    'users',
    'student_profiles',
    'teacher_profiles',
    'audit_logs',
    'model_access_logs',
    'platform_events',
    'favorite_models',
    'model_annotations',
    'study_sessions',
    'subscriptions'
  )
order by tablename;

-- 2.2 Policies ativas em tabelas criticas.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and tablename in (
    'institutions',
    'users',
    'student_profiles',
    'teacher_profiles',
    'audit_logs',
    'model_access_logs',
    'platform_events',
    'favorite_models',
    'model_annotations',
    'study_sessions',
    'subscriptions',
    'objects'
  )
order by schemaname, tablename, policyname;

-- 2.3 Helpers security definer criados no schema private.
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'private'
  and p.proname in (
    'current_user_role',
    'current_user_status',
    'current_user_institution_id',
    'protect_users_sensitive_columns',
    'handle_new_auth_user'
  )
order by p.proname;

-- =========================================================
-- BLOCO 3: AUTH.USERS X PUBLIC.USERS
-- =========================================================

-- 3.1 Usuarios autenticados sem perfil publico.
select
  au.id,
  au.email,
  au.created_at
from auth.users au
left join public.users u on u.id = au.id
where u.id is null
order by au.created_at desc;

-- 3.2 Perfis public.users sem auth.users.
select
  u.id,
  u.email,
  u.role,
  u.status,
  u.created_at
from public.users u
left join auth.users au on au.id = u.id
where au.id is null
order by u.created_at desc;

-- 3.3 Usuarios pending que ainda precisam aprovacao institucional.
select
  u.id,
  u.email,
  u.role,
  u.status,
  i.slug as tenant,
  u.created_at
from public.users u
left join public.institutions i on i.id = u.institution_id
where u.status = 'pending'
order by u.created_at desc;

-- =========================================================
-- BLOCO 4: LOGS, AUDITORIA E CROSS-TENANT
-- =========================================================

-- 4.1 Logs de modelo cujo institution_id diverge do usuario.
select
  l.id as log_id,
  l.created_at,
  l.user_id,
  u.email,
  l.institution_id as log_institution_id,
  u.institution_id as user_institution_id,
  l.model_id,
  l.action
from public.model_access_logs l
join public.users u on u.id = l.user_id
where l.institution_id is distinct from u.institution_id
order by l.created_at desc;

-- 4.2 Logs de modelo sem campos obrigatorios.
select
  id,
  institution_id,
  user_id,
  model_id,
  action,
  duration_seconds,
  created_at
from public.model_access_logs
where institution_id is null
   or user_id is null
   or model_id is null
   or action is null
   or duration_seconds < 0
order by created_at desc;

-- 4.3 Eventos de plataforma sem tenant quando ha usuario institucional.
select
  e.id,
  e.event_type,
  e.event_category,
  e.institution_id as event_institution_id,
  u.institution_id as user_institution_id,
  e.user_id,
  e.created_at
from public.platform_events e
join public.users u on u.id = e.user_id
where u.role in ('student', 'teacher', 'institution_admin')
  and e.institution_id is distinct from u.institution_id
order by e.created_at desc;

-- 4.4 Audit logs sensiveis sem usuario ou tenant.
select
  id,
  institution_id,
  user_id,
  action,
  target_table,
  target_id,
  created_at
from public.audit_logs
where institution_id is null
   or user_id is null
   or action is null
order by created_at desc;

rollback;

-- =========================================================
-- BLOCO 5: SIMULACOES RLS COM ROLLBACK
-- Substitua os placeholders antes de rodar.
-- =========================================================

-- 5.1 Leitura como usuario autenticado.
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<USER_UUID>';
-- select auth.uid() as simulated_auth_uid;
-- select id, email, role, status, institution_id from public.users order by created_at desc limit 20;
-- select * from public.model_access_logs order by created_at desc limit 20;
-- rollback;

-- 5.2 Tentativa de insert valido no proprio tenant.
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<ACTIVE_USER_UUID>';
-- insert into public.model_access_logs (
--   institution_id,
--   user_id,
--   model_id,
--   action,
--   duration_seconds,
--   metadata
-- ) values (
--   '<USER_INSTITUTION_UUID>',
--   '<ACTIVE_USER_UUID>',
--   '<MODEL_UUID>',
--   'view_model',
--   0,
--   '{"validation":"same_tenant"}'::jsonb
-- ) returning id, institution_id, user_id, model_id, action, duration_seconds;
-- rollback;

-- 5.3 Tentativa de insert cross-tenant. Deve falhar por RLS.
-- begin;
-- set local role authenticated;
-- set local request.jwt.claim.sub = '<ACTIVE_USER_UUID>';
-- insert into public.model_access_logs (
--   institution_id,
--   user_id,
--   model_id,
--   action,
--   duration_seconds,
--   metadata
-- ) values (
--   '<OTHER_INSTITUTION_UUID>',
--   '<ACTIVE_USER_UUID>',
--   '<MODEL_UUID>',
--   'view_model',
--   0,
--   '{"validation":"cross_tenant_should_fail"}'::jsonb
-- );
-- rollback;
