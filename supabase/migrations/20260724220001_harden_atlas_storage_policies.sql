-- Migration: Harden Atlas Storage Policies
-- Descrição: Substitui as regras genéricas de upload e update de qualquer user authenticated 
-- para garantir que apenas admins podem modificar assets do atlas-model-assets.

DROP POLICY IF EXISTS "Public Read Access for Atlas Model Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Delete Atlas Models" ON storage.objects;

-- 1. Leitura Pública (Mantida, pois modelos precisam ser servidos caso nativo seja reativado. 
-- Mas como o fluxo é Sketchfab, este bucket não é servido a alunos, embora fique public.
CREATE POLICY "Public Read Access for Atlas Model Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atlas-model-assets');

-- 2. Insert (Apenas administradores globais)
CREATE POLICY "Admin Upload Atlas Models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'atlas-model-assets' AND
  public.current_user_role() IN ('admin', 'super_admin', 'founder')
);

-- 3. Update / Sobrescrita (Apenas admins)
CREATE POLICY "Admin Update Atlas Models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('admin', 'super_admin', 'founder'))
WITH CHECK (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('admin', 'super_admin', 'founder'));

-- 4. Delete (Apenas admins globais de alto escalão)
CREATE POLICY "SuperAdmin Delete Atlas Models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atlas-model-assets' AND public.current_user_role() IN ('super_admin', 'founder'));
