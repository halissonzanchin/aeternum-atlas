-- =========================================================
-- AETERNUM ATLAS - MODEL ANNOTATIONS CACHE
-- =========================================================
-- Objetivo:
-- - armazenar as annotations reais do Sketchfab por modelo;
-- - manter a ordem 01, 02, 03... igual ao viewer 3D;
-- - permitir que o frontend leia dados normalizados sem depender de listas hardcoded.
--
-- Como usar:
-- - rode este arquivo no Supabase SQL Editor;
-- - depois execute tools/aeternum_sync para sincronizar Sketchfab -> Supabase.
-- =========================================================

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.model_annotations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models_3d(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  sketchfab_uid text not null,
  annotation_uid text,
  annotation_index integer not null check (annotation_index >= 0),
  title text not null,
  description text,
  eye jsonb,
  target jsonb,
  position jsonb,
  images jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  source text not null default 'sketchfab',
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, annotation_index)
);

create index if not exists model_annotations_model_idx
  on public.model_annotations(model_id, annotation_index);

create index if not exists model_annotations_institution_idx
  on public.model_annotations(institution_id, model_id);

alter table public.model_annotations enable row level security;

grant select on table public.model_annotations to authenticated;
grant select, insert, update, delete on table public.model_annotations to service_role;

drop policy if exists "model_annotations_select_same_institution" on public.model_annotations;

create policy "model_annotations_select_same_institution"
  on public.model_annotations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and (
          u.role = 'super_admin'
          or u.institution_id = model_annotations.institution_id
        )
    )
  );

create or replace function public.touch_model_annotations_sync()
returns trigger
language plpgsql
as $$
begin
  new.synced_at = now();
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_model_annotations_sync on public.model_annotations;

create trigger touch_model_annotations_sync
  before update on public.model_annotations
  for each row
  execute function public.touch_model_annotations_sync();

commit;

-- Verificacao:
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as row_level_security_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'model_annotations';
