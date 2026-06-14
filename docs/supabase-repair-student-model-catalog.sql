-- =========================================================
-- AETERNUM ATLAS - REPARO DO CATALOGO 3D DO ALUNO
-- =========================================================
-- Sintoma corrigido:
-- - student@aeternum.com entra normalmente, mas /models mostra:
--   "Nenhum modelo institucional disponivel no momento."
--
-- Causa validada:
-- - public.users esta correto para o aluno:
--   institution_id = e607ea36-a9e6-463e-9860-56226959e47e
--   institution.slug = aeternum-test-university
-- - a consulta autenticada em public.models_3d retorna zero modelos.
--
-- Como usar:
-- 1) Abra Supabase Dashboard > SQL Editor.
-- 2) Rode este arquivo inteiro.
-- 3) Recarregue http://localhost:5173/models logado como aluno.
--
-- Seguranca:
-- - Nao apaga dados.
-- - Nao libera acesso anonimo.
-- - Mantem isolamento por institution_id.
-- - Super admin le globalmente; aluno/professor/admin institucional leem
--   somente modelos ativos da propria instituicao.
-- =========================================================

begin;

-- 0) Pre-flight: as funcoes private.* sao usadas pelas policies multi-tenant.
do $$
begin
  if to_regprocedure('private.current_user_role()') is null
    or to_regprocedure('private.current_user_status()') is null
    or to_regprocedure('private.current_user_institution_id()') is null
  then
    raise exception 'Rode docs/supabase-enterprise-alignment.sql antes deste reparo: funcoes private.current_user_* ausentes.';
  end if;
end $$;

-- 1) Garante que a instituicao usada pelas contas de teste exista e esteja ativa.
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
  'e607ea36-a9e6-463e-9860-56226959e47e',
  'Aeternum Test University',
  'aeternum-test-university',
  'Brazil',
  'Online',
  true,
  3000,
  0,
  0,
  'active',
  now(),
  now()
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  active = true,
  contract_status = 'active',
  updated_at = now();

-- 2) Garante a chave usada pelo upsert dos modelos.
create unique index if not exists models_3d_institution_slug_unique_idx
on public.models_3d (institution_id, slug);

-- 3) Habilita a leitura segura do catalogo 3D via Supabase API.
alter table public.models_3d enable row level security;

grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_user_status() to authenticated;
grant execute on function private.current_user_institution_id() to authenticated;
grant select on public.models_3d to authenticated;

drop policy if exists "models_3d_select_by_tenant" on public.models_3d;
create policy "models_3d_select_by_tenant"
on public.models_3d
for select
to authenticated
using (
  (select private.current_user_role()) = 'super_admin'
  or (
    (select private.current_user_status()) = 'active'
    and institution_id = (select private.current_user_institution_id())
    and (select private.current_user_role()) in (
      'student',
      'teacher',
      'institution_admin'
    )
    and coalesce(status, 'active') in (
      'active',
      'ativo',
      'available',
      'disponivel',
      'disponível'
    )
  )
);

-- 4) Semeia os modelos institucionais usados pela plataforma.
with seed_models as (
  select
    'e607ea36-a9e6-463e-9860-56226959e47e'::uuid as institution_id,
    'coracao-humano-superficial'::text as slug,
    'Coração Humano — Modelo Superficial 3D'::text as title,
    'Sistema cardiovascular'::text as anatomical_system,
    'Tórax'::text as anatomical_region,
    'https://sketchfab.com/3d-models/corazon-humano-3d-modelo-fd61a9605f4148a9b5274463f7adbcb5'::text as sketchfab_url,
    'https://sketchfab.com/models/fd61a9605f4148a9b5274463f7adbcb5/embed'::text as embed_url,
    'basic'::text as difficulty_level,
    jsonb_build_array(
      'Modelo anatomico 3D superficial do coracao humano hospedado no Sketchfab.',
      'Visualizacao das faces cardiacas, vasos da base e relacoes anatomicas externas.'
    ) as tags,
    'active'::text as status,
    null::text as thumbnail_url

  union all

  select
    'e607ea36-a9e6-463e-9860-56226959e47e'::uuid as institution_id,
    'corte-sagital-cranio-humano-superficial'::text as slug,
    'Corte Sagital do Crânio Humano — Modelo Superficial 3D'::text as title,
    'Sistema nervoso'::text as anatomical_system,
    'Cabeça e pescoço'::text as anatomical_region,
    'https://sketchfab.com/3d-models/corte-sagital-del-encefalo-humano-modelo-3d-0145e302fd94453c8f7fb2817e45060e'::text as sketchfab_url,
    'https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed'::text as embed_url,
    'basic'::text as difficulty_level,
    jsonb_build_array(
      'Modelo anatomico em corte sagital da cabeca humana hospedado no Sketchfab.',
      'Apoio ao estudo do encefalo, cavidade craniana, vias aereas superiores e relacoes medianas.'
    ) as tags,
    'active'::text as status,
    null::text as thumbnail_url
)
insert into public.models_3d (
  institution_id,
  title,
  slug,
  anatomical_system,
  anatomical_region,
  sketchfab_url,
  embed_url,
  difficulty_level,
  tags,
  status,
  thumbnail_url
)
select
  institution_id,
  title,
  slug,
  anatomical_system,
  anatomical_region,
  sketchfab_url,
  embed_url,
  difficulty_level,
  tags,
  status,
  thumbnail_url
from seed_models
on conflict (institution_id, slug) do update set
  title = excluded.title,
  anatomical_system = excluded.anatomical_system,
  anatomical_region = excluded.anatomical_region,
  sketchfab_url = excluded.sketchfab_url,
  embed_url = excluded.embed_url,
  difficulty_level = excluded.difficulty_level,
  tags = excluded.tags,
  status = excluded.status,
  thumbnail_url = excluded.thumbnail_url;

commit;

-- =========================================================
-- VERIFICACAO
-- =========================================================

-- A) Confirme que as contas conhecidas estao ativas e vinculadas.
select
  u.email,
  u.name,
  u.role,
  u.status,
  u.institution_id,
  i.slug as institution_slug,
  i.name as institution_name
from public.users u
left join public.institutions i on i.id = u.institution_id
where lower(u.email) in (
  lower('admin@aeternum.com'),
  lower('student@aeternum.com'),
  lower('professorlucasparedes@aeternum.com'),
  lower('upepresidentefranco@aeternum.com')
)
order by u.role, u.email;

-- B) Confirme que o catalogo institucional tem modelos ativos.
select
  i.slug as institution_slug,
  m.slug,
  m.title,
  m.status,
  m.embed_url
from public.models_3d m
join public.institutions i on i.id = m.institution_id
where i.slug = 'aeternum-test-university'
order by m.slug;
