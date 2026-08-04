-- Migration: Correct Atlas Models Visibility & Storage RLS (Fase R1.3E)
-- Descrição: Consolida todas as políticas de visibilidade das tabelas atlas_*, endurece as
-- funções de autorização (SECURITY DEFINER com search_path = public) e privatiza o bucket.

-- -----------------------------------------------------------------------------
-- 0. Endurecimento das Funções de Autorização e Helpers
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.current_user_institution_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;

DROP FUNCTION IF EXISTS public.current_user_institution_id();
DROP FUNCTION IF EXISTS public.current_user_role();

CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  -- O uso de id = auth.uid() em public.users é garantido ser único (PK)
  SELECT institution_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_institution_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
-- NOTA: O anônimo não ganha acesso. As consultas públicas lidam com institution_availability ? 'global'

-- Função Centralizada de Visibilidade Segura
DROP FUNCTION IF EXISTS public.can_read_atlas_model(uuid);
CREATE OR REPLACE FUNCTION public.can_read_atlas_model(model_uuid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.atlas_models m
    WHERE m.id = model_uuid
      AND m.status = 'published'
      AND (
        m.institution_availability ? 'global' OR
        (auth.uid() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.can_read_atlas_model(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_atlas_model(uuid) TO anon;

-- -----------------------------------------------------------------------------
-- 1. Visibilidade: atlas_models
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read for published models" ON public.atlas_models;
DROP POLICY IF EXISTS "Institutional read for published models" ON public.atlas_models;
DROP POLICY IF EXISTS "Institutional read for published atlas models" ON public.atlas_models;

CREATE POLICY "Institutional read for published atlas models" ON public.atlas_models
FOR SELECT USING (
  status = 'published'
  AND (
    institution_availability ? 'global' OR 
    (auth.uid() IS NOT NULL AND institution_availability ? (public.current_user_institution_id()::text))
  )
);

-- -----------------------------------------------------------------------------
-- 2. Visibilidade: atlas_model_annotations (Filha)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read for annotations of published models" ON public.atlas_model_annotations;
DROP POLICY IF EXISTS "Institutional read for annotations of published models" ON public.atlas_model_annotations;
DROP POLICY IF EXISTS "Institutional read for annotations of published atlas models" ON public.atlas_model_annotations;

CREATE POLICY "Institutional read for annotations of published atlas models" ON public.atlas_model_annotations
FOR SELECT USING (
  public.can_read_atlas_model(atlas_model_annotations.model_id)
);

-- -----------------------------------------------------------------------------
-- 3. Visibilidade: atlas_model_assets (Filha)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read for assets of published models" ON public.atlas_model_assets;
DROP POLICY IF EXISTS "Institutional read for assets of published models" ON public.atlas_model_assets;
DROP POLICY IF EXISTS "Institutional read for assets of published atlas models" ON public.atlas_model_assets;

CREATE POLICY "Institutional read for assets of published atlas models" ON public.atlas_model_assets
FOR SELECT USING (
  public.can_read_atlas_model(atlas_model_assets.model_id)
);

-- -----------------------------------------------------------------------------
-- 4. Restrição de Storage (atlas-model-assets) & Privatização
-- -----------------------------------------------------------------------------

-- Remover acesso legados e permissivos do bucket
DROP POLICY IF EXISTS "Public read access to assets bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access for Atlas Model Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Delete Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload access to assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmin Delete Atlas Models" ON storage.objects;

-- Tornar o Bucket Oficialmente Privado a Nível de Schema
UPDATE storage.buckets
SET public = false
WHERE id = 'atlas-model-assets';

-- Acesso de Leitura ao Storage (Apenas Founders e Super Admins via admin panel)
-- Notas: Alunos utilizam o Sketchfab. O bucket de assets guarda apenas arquivos fontes (GLB, OBJ) originais
-- A UI usa presigned URLs se for extritamente necessário ler ou baixar.
CREATE POLICY "SuperAdmin Read Atlas Models"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('super_admin', 'founder'));

-- Insert (Apenas Founder e Super Admin)
CREATE POLICY "SuperAdmin Upload Atlas Models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atlas-model-assets' AND
  public.current_user_role() IN ('super_admin', 'founder')
);

-- Update (Apenas Founder e Super Admin)
CREATE POLICY "SuperAdmin Update Atlas Models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('super_admin', 'founder'))
WITH CHECK (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('super_admin', 'founder'));

-- Delete (Apenas Founder e Super Admin)
CREATE POLICY "SuperAdmin Delete Atlas Models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('super_admin', 'founder'));
