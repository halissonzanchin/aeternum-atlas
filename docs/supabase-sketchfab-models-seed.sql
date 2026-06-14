-- =========================================================
-- AETERNUM ATLAS - CATÁLOGO SKETCHFAB INSTITUCIONAL
-- =========================================================
-- Objetivo:
-- 1) garantir o retorno do modelo cardíaco no catálogo real;
-- 2) cadastrar o modelo de corte sagital do crânio humano;
-- 3) manter o seed idempotente por instituição + slug.
--
-- Como usar:
-- - rode este arquivo no Supabase SQL Editor;
-- - não rode pelo frontend: RLS bloqueia escrita direta em models_3d;
-- - por padrão ele replica os dois modelos para:
--   * upe-presidente-franco
--   * aeternum-test-university
-- - remova um slug da CTE target_institutions se quiser limitar o seed.
--
-- Pré-requisito:
-- - os tenants informados já precisam existir em public.institutions.
-- =========================================================

begin;

with target_institutions as (
  select id, slug
  from public.institutions
  where slug in ('upe-presidente-franco', 'aeternum-test-university')
),
seed_models as (
  select
    'coracao-humano-superficial'::text as slug,
    'Coração Humano — Modelo Superficial 3D'::text as title,
    'Sistema cardiovascular'::text as anatomical_system,
    'Tórax'::text as anatomical_region,
    'https://sketchfab.com/3d-models/corazon-humano-3d-modelo-fd61a9605f4148a9b5274463f7adbcb5'::text as sketchfab_url,
    'https://sketchfab.com/models/fd61a9605f4148a9b5274463f7adbcb5/embed'::text as embed_url,
    'basic'::text as difficulty_level,
    jsonb_build_array(
      'Modelo anatômico 3D superficial do coração humano hospedado no Sketchfab.',
      'Visualização das faces cardíacas, vasos da base e relações anatômicas externas.'
    ) as tags,
    'active'::text as status,
    null::text as thumbnail_url

  union all

  select
    'corte-sagital-cranio-humano-superficial'::text as slug,
    'Corte Sagital do Crânio Humano — Modelo Superficial 3D'::text as title,
    'Sistema nervoso'::text as anatomical_system,
    'Cabeça e pescoço'::text as anatomical_region,
    'https://sketchfab.com/3d-models/corte-sagital-del-encefalo-humano-modelo-3d-0145e302fd94453c8f7fb2817e45060e'::text as sketchfab_url,
    'https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed'::text as embed_url,
    'basic'::text as difficulty_level,
    jsonb_build_array(
      'Modelo anatômico em corte sagital da cabeça humana hospedado no Sketchfab.',
      'Apoio ao estudo do encéfalo, cavidade craniana, vias aéreas superiores e relações medianas.'
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
  institution.id,
  model.title,
  model.slug,
  model.anatomical_system,
  model.anatomical_region,
  model.sketchfab_url,
  model.embed_url,
  model.difficulty_level,
  model.tags,
  model.status,
  model.thumbnail_url
from target_institutions institution
cross join seed_models model
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

-- Verificação final:
select
  institution.slug as institution_slug,
  model.slug,
  model.title,
  model.anatomical_system,
  model.anatomical_region,
  model.embed_url,
  model.status
from public.models_3d model
join public.institutions institution on institution.id = model.institution_id
where institution.slug in ('upe-presidente-franco', 'aeternum-test-university')
  and model.slug in (
    'coracao-humano-superficial',
    'corte-sagital-cranio-humano-superficial'
  )
order by institution.slug, model.slug;
