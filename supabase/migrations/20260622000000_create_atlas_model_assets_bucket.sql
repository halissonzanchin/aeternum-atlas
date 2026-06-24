-- Migration to create the atlas-model-assets bucket and configure RLS policies
-- Limite: 2GB (2147483648 bytes)
-- Formatos suportados: model/gltf-binary (.glb), model/gltf+json (.gltf), text/plain (.obj), application/octet-stream (fallback)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'atlas-model-assets',
  'atlas-model-assets',
  true, -- public: true so we can use getPublicUrl()
  2147483648, -- 2GB
  ARRAY['model/gltf-binary', 'model/gltf+json', 'text/plain', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Remove existing policies for clean slate
DROP POLICY IF EXISTS "Public Read Access for Atlas Model Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Update Atlas Models" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Delete Atlas Models" ON storage.objects;

-- Create Policies

-- 1. Leitura Pública (Qualquer um pode ler modelos, necessário para o Viewer)
CREATE POLICY "Public Read Access for Atlas Model Assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'atlas-model-assets');

-- 2. Upload para Autenticados (Apenas Super Admin / Institution Admin farão upload via CMS)
CREATE POLICY "Authenticated Users Can Upload Atlas Models"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'atlas-model-assets');

-- 3. Edição/Update para Autenticados
CREATE POLICY "Authenticated Users Can Update Atlas Models"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'atlas-model-assets')
WITH CHECK (bucket_id = 'atlas-model-assets');

-- 4. Exclusão para Autenticados
CREATE POLICY "Authenticated Users Can Delete Atlas Models"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'atlas-model-assets');
