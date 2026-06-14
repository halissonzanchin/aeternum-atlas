-- =========================================================
-- AETERNUM ATLAS - MULTI-TENANT UPE SEED
-- =========================================================
-- Objetivo:
-- Criar/atualizar tenants institucionais reais para a UPE:
-- 1) UPE - Presidente Franco
-- 2) UPE - Ciudad del Este
--
-- Este arquivo NÃO apaga dados.
-- Não usa DROP TABLE, TRUNCATE, DELETE ou CASCADE destrutivo.
--
-- Ordem recomendada:
-- 1) Rodar BLOCO 1 para garantir as instituições.
-- 2) Rodar BLOCO 2 para verificar as instituições criadas.
-- 3) Rodar BLOCO 3, ajustando os e-mails reais dos usuários.
-- 4) Rodar BLOCO 4 para auditar usuários sem vínculo institucional.
--
-- Observação:
-- Usuários institucionais devem ter:
-- - institution_id preenchido
-- - role controlado
-- - status = active quando liberados para acesso
--
-- Roles esperadas:
-- - student
-- - teacher
-- - institution_admin
-- - super_admin
--
-- Status esperados:
-- - active
-- - inactive
-- - pending
-- - suspended
-- =========================================================

begin;

-- =========================================================
-- BLOCO 1: UPSERT DAS INSTITUIÇÕES UPE
-- Seguro para rodar agora.
-- Risco: baixo.
-- Impacto: cria ou atualiza duas linhas em public.institutions.
-- =========================================================

do $$
declare
  presidente_franco_id uuid := '0f5b52be-5c4e-4d48-98d8-65b168f00101';
  ciudad_del_este_id uuid := '0f5b52be-5c4e-4d48-98d8-65b168f00102';
begin
  if exists (
    select 1 from public.institutions
    where slug = 'upe-presidente-franco'
  ) then
    update public.institutions
    set
      name = 'UPE - Presidente Franco',
      country = 'Paraguay',
      city = 'Presidente Franco',
      active = true,
      contracted_capacity = 3000,
      active_students = coalesce(active_students, 0),
      price_per_student = 50,
      contract_status = 'active',
      updated_at = now()
    where slug = 'upe-presidente-franco';
  else
    insert into public.institutions (
      id,
      name,
      slug,
      country,
      city,
      active,
      contracted_capacity,
      active_students,
      price_per_student,
      contract_status,
      created_at,
      updated_at
    )
    values (
      presidente_franco_id,
      'UPE - Presidente Franco',
      'upe-presidente-franco',
      'Paraguay',
      'Presidente Franco',
      true,
      3000,
      0,
      50,
      'active',
      now(),
      now()
    );
  end if;

  if exists (
    select 1 from public.institutions
    where slug = 'upe-ciudad-del-este'
  ) then
    update public.institutions
    set
      name = 'UPE - Ciudad del Este',
      country = 'Paraguay',
      city = 'Ciudad del Este',
      active = true,
      contracted_capacity = 3000,
      active_students = coalesce(active_students, 0),
      price_per_student = 50,
      contract_status = 'active',
      updated_at = now()
    where slug = 'upe-ciudad-del-este';
  else
    insert into public.institutions (
      id,
      name,
      slug,
      country,
      city,
      active,
      contracted_capacity,
      active_students,
      price_per_student,
      contract_status,
      created_at,
      updated_at
    )
    values (
      ciudad_del_este_id,
      'UPE - Ciudad del Este',
      'upe-ciudad-del-este',
      'Paraguay',
      'Ciudad del Este',
      true,
      3000,
      0,
      50,
      'active',
      now(),
      now()
    );
  end if;
end $$;

commit;

-- =========================================================
-- BLOCO 2: VALIDAÇÃO DAS INSTITUIÇÕES
-- Seguro para rodar agora.
-- Apenas SELECT.
-- =========================================================

select
  id,
  name,
  slug,
  country,
  city,
  active,
  contracted_capacity,
  active_students,
  price_per_student,
  contract_status,
  created_at,
  updated_at
from public.institutions
where slug in ('upe-presidente-franco', 'upe-ciudad-del-este')
order by slug;

-- =========================================================
-- BLOCO 3: VÍNCULO DE USUÁRIOS À INSTITUIÇÃO
-- Rodar depois de revisar os e-mails reais.
-- Risco: médio, pois altera institution_id/role/status dos usuários.
--
-- IMPORTANTE:
-- Troque os e-mails abaixo pelos usuários reais existentes em:
-- Supabase Dashboard > Authentication > Users
-- e também em public.users.
-- =========================================================

-- Exemplo: admin institucional de Presidente Franco
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-presidente-franco'
--   ),
--   role = 'institution_admin',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('admin.presidente-franco@upe.edu.py');

-- Exemplo: professor de Presidente Franco
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-presidente-franco'
--   ),
--   role = 'teacher',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('professor.presidente-franco@upe.edu.py');

-- Exemplo: aluno de Presidente Franco
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-presidente-franco'
--   ),
--   role = 'student',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('aluno.presidente-franco@upe.edu.py');

-- Exemplo: admin institucional de Ciudad del Este
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-ciudad-del-este'
--   ),
--   role = 'institution_admin',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('admin.cde@upe.edu.py');

-- Exemplo: professor de Ciudad del Este
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-ciudad-del-este'
--   ),
--   role = 'teacher',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('professor.cde@upe.edu.py');

-- Exemplo: aluno de Ciudad del Este
-- update public.users
-- set
--   institution_id = (
--     select id from public.institutions
--     where slug = 'upe-ciudad-del-este'
--   ),
--   role = 'student',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('aluno.cde@upe.edu.py');

-- Exemplo: super admin Aeternum
-- Recomendação: super_admin pode ficar sem institution_id se for global.
-- Se sua policy exigir institution_id, vincule a uma instituição interna Aeternum futuramente.
-- update public.users
-- set
--   role = 'super_admin',
--   status = 'active',
--   updated_at = now()
-- where lower(email) = lower('admin@aeternum.com');

-- =========================================================
-- BLOCO 4: AUDITORIA DE USUÁRIOS MULTI-TENANT
-- Seguro para rodar agora.
-- Apenas SELECT.
-- =========================================================

-- 4.1 Usuários institucionais sem institution_id
select
  id,
  name,
  email,
  role,
  status,
  institution_id,
  created_at,
  updated_at
from public.users
where role in ('student', 'teacher', 'institution_admin')
  and institution_id is null
order by created_at desc;

-- 4.2 Usuários com institution_id inexistente
select
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  u.institution_id
from public.users u
left join public.institutions i on i.id = u.institution_id
where u.institution_id is not null
  and i.id is null
order by u.created_at desc;

-- 4.3 Distribuição de usuários por instituição
select
  i.name as institution_name,
  i.slug as institution_slug,
  u.role,
  u.status,
  count(*) as total_users
from public.users u
left join public.institutions i on i.id = u.institution_id
group by i.name, i.slug, u.role, u.status
order by i.slug nulls last, u.role, u.status;

-- 4.4 Resumo institucional esperado para dashboards
select
  i.id,
  i.name,
  i.slug,
  i.country,
  i.city,
  i.active,
  i.contracted_capacity,
  i.active_students,
  i.price_per_student,
  i.contract_status,
  count(u.id) filter (where u.role = 'student') as registered_students,
  count(u.id) filter (where u.role = 'student' and u.status = 'active') as active_students_real,
  count(u.id) filter (where u.role = 'teacher' and u.status = 'active') as active_teachers,
  count(u.id) filter (where u.role = 'institution_admin' and u.status = 'active') as active_admins
from public.institutions i
left join public.users u on u.institution_id = i.id
where i.slug in ('upe-presidente-franco', 'upe-ciudad-del-este')
group by
  i.id,
  i.name,
  i.slug,
  i.country,
  i.city,
  i.active,
  i.contracted_capacity,
  i.active_students,
  i.price_per_student,
  i.contract_status
order by i.slug;

-- =========================================================
-- BLOCO 5: SINCRONIZAR active_students COM USUÁRIOS REAIS
-- Opcional.
-- Risco: baixo/médio. Atualiza public.institutions.active_students
-- com base em public.users.
-- Rode apenas quando aceitar que o número seja derivado do banco real.
-- =========================================================

-- update public.institutions i
-- set
--   active_students = coalesce(stats.active_students, 0),
--   updated_at = now()
-- from (
--   select
--     institution_id,
--     count(*) filter (where role = 'student' and status = 'active') as active_students
--   from public.users
--   where institution_id is not null
--   group by institution_id
-- ) stats
-- where i.id = stats.institution_id
--   and i.slug in ('upe-presidente-franco', 'upe-ciudad-del-este');

