-- Rollback: Reverter Atlas Models Visibility & Storage RLS (Emergência e Fiel)
-- Rollback FIEL à migration 20260624000000_fix_atlas_models_institution_visibility_rls
-- e 20260622000000_create_atlas_model_assets_bucket

-- -----------------------------------------------------------------------------
-- 0. Reverter Funções de Autorização (Remover schema qualify e grants restritos)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.can_read_atlas_model(uuid);

REVOKE ALL ON FUNCTION public.current_user_institution_id() FROM authenticated;
REVOKE ALL ON FUNCTION public.current_user_role() FROM authenticated;

DROP FUNCTION IF EXISTS public.current_user_institution_id();
DROP FUNCTION IF EXISTS public.current_user_role();

CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT institution_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- -----------------------------------------------------------------------------
-- 1. Reverter Visibilidade: atlas_models
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Institutional read for published atlas models" ON public.atlas_models;

CREATE POLICY "Institutional read for published models" ON public.atlas_models
FOR SELECT USING (
  status = 'published'
  AND (
    institution_availability ? 'global' OR 
    (public.current_user_institution_id() IS NOT NULL AND institution_availability ? (public.current_user_institution_id()::text))
  )
);

CREATE POLICY "Admin full access to models" ON public.atlas_models
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
) WITH CHECK (
  public.current_user_role() IN ('admin', 'super_admin')
);

-- -----------------------------------------------------------------------------
-- 2. Reverter Visibilidade: atlas_model_annotations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Institutional read for annotations of published atlas models" ON public.atlas_model_annotations;

CREATE POLICY "Institutional read for annotations of published models" ON public.atlas_model_annotations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.atlas_models m 
    WHERE m.id = atlas_model_annotations.model_id 
    AND m.status = 'published'
    AND (
      m.institution_availability ? 'global' OR 
      (public.current_user_institution_id() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
    )
  )
);

CREATE POLICY "Admin full access to annotations" ON public.atlas_model_annotations
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
) WITH CHECK (
  public.current_user_role() IN ('admin', 'super_admin')
);

-- -----------------------------------------------------------------------------
-- 3. Reverter Visibilidade: atlas_model_assets
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Institutional read for assets of published atlas models" ON public.atlas_model_assets;

CREATE POLICY "Institutional read for assets of published models" ON public.atlas_model_assets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.atlas_models m 
    WHERE m.id = atlas_model_assets.model_id 
    AND m.status = 'published'
    AND (
      m.institution_availability ? 'global' OR 
      (public.current_user_institution_id() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
    )
  )
);

CREATE POLICY "Admin full access to assets" ON public.atlas_model_assets
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
) WITH CHECK (
  public.current_user_role() IN ('admin', 'super_admin')
);

-- -----------------------------------------------------------------------------
-- 4. Reverter Restrição de Storage (atlas-model-assets)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "SuperAdmin Read Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmin Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmin Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmin Delete Atlas Models" ON storage.objects;

-- Tornar o Bucket Público Novamente
UPDATE storage.buckets
SET public = true
WHERE id = 'atlas-model-assets';

CREATE POLICY "Public Read Access for Atlas Model Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atlas-model-assets');

CREATE POLICY "Authenticated Users Can Upload Atlas Models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atlas-model-assets' AND
  public.current_user_role() IN ('admin', 'super_admin', 'founder')
);

CREATE POLICY "Authenticated Users Can Update Atlas Models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('admin', 'super_admin', 'founder'))
WITH CHECK (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('admin', 'super_admin', 'founder'));

CREATE POLICY "Authenticated Users Can Delete Atlas Models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('admin', 'super_admin', 'founder'));
