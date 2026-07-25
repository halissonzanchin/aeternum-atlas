-- Migration: Correct Atlas Models Visibility & Storage RLS (Fase R1.3C)
-- Descrição: Substitui as migrations defeituosas de visibilidade e storage (Fase R1.3B).
-- Utiliza o schema correto de atlas_models (status e institution_availability JSONB)
-- e restringe uploads no storage para super_admin e founder apenas (removendo admin ambíguo).

-- -----------------------------------------------------------------------------
-- 1. Visibilidade de Modelos e Anotações
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Institutional read for published models" ON public.atlas_models;
DROP POLICY IF EXISTS "Institutional read for published atlas models" ON public.atlas_models;

CREATE POLICY "Institutional read for published atlas models" ON public.atlas_models
FOR SELECT USING (
  status = 'published'
  AND (
    institution_availability ? 'global' OR 
    (public.current_user_institution_id() IS NOT NULL AND institution_availability ? (public.current_user_institution_id()::text))
  )
);

DROP POLICY IF EXISTS "Institutional read for annotations of published models" ON public.atlas_model_annotations;
DROP POLICY IF EXISTS "Institutional read for annotations of published atlas models" ON public.atlas_model_annotations;

CREATE POLICY "Institutional read for annotations of published atlas models" ON public.atlas_model_annotations
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

-- -----------------------------------------------------------------------------
-- 2. Restrição de Storage (atlas-model-assets)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public Read Access for Atlas Model Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Delete Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "SuperAdmin Delete Atlas Models" ON storage.objects;

-- Leitura Pública
CREATE POLICY "Public Read Access for Atlas Model Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atlas-model-assets');

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
