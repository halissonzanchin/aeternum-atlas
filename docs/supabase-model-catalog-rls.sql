-- =========================================================
-- AETERNUM ATLAS - RLS DE LEITURA DO CATÁLOGO 3D
-- =========================================================
-- Objetivo:
-- Permitir que usuários autenticados e ativos leiam modelos 3D
-- da própria instituição, mantendo isolamento multi-tenant.
--
-- Contexto:
-- O seed de models_3d deve ser executado no SQL Editor, mas a
-- aplicação React/Vite precisa conseguir ler o catálogo via API.
--
-- Segurança:
-- - Não permite INSERT/UPDATE/DELETE pelo frontend.
-- - Não libera anon.
-- - Bloqueia cross-tenant para usuários institucionais.
-- - Super admin pode ler catálogo global.
--
-- Pré-requisito:
-- As funções private.current_user_role(),
-- private.current_user_status() e
-- private.current_user_institution_id() precisam existir.
-- Elas foram criadas no alignment enterprise.
-- =========================================================

begin;

alter table public.models_3d enable row level security;

grant select on public.models_3d to authenticated;

create index if not exists models_3d_institution_slug_idx
on public.models_3d (institution_id, slug);

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

commit;

-- Verificação pós-policy:
-- Rode autenticado pela aplicação ou teste novamente no frontend.
-- No SQL Editor como postgres, esta consulta apenas confirma os dados existentes.
select
  institution.slug as institution_slug,
  model.slug,
  model.title,
  model.status
from public.models_3d model
join public.institutions institution on institution.id = model.institution_id
where model.slug in (
  'coracao-humano-superficial',
  'corte-sagital-cranio-humano-superficial'
)
order by institution.slug, model.slug;
