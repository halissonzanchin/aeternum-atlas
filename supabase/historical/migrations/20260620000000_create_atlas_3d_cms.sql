-- 20260620000000_create_atlas_3d_cms.sql
-- Migration Draft: Atlas 3D Native Engine CMS & Markers
-- Description: Creates architecture for Aeternum proprietary models, avoiding 'models' legacy table.

-- 1. Criação da Tabela de Modelos 3D proprietários
CREATE TABLE IF NOT EXISTS public.atlas_3d_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  model_url TEXT NOT NULL,
  model_format TEXT NOT NULL CHECK (model_format IN ('glb', 'obj', 'sketchfab')),
  viewer_engine TEXT NOT NULL DEFAULT 'atlas' CHECK (viewer_engine IN ('atlas', 'sketchfab')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  institution_id TEXT, -- Null indica modelo global Aeternum
  created_by TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela de Marcadores Anatômicos
CREATE TABLE IF NOT EXISTS public.atlas_3d_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.atlas_3d_models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position JSONB NOT NULL,
  camera_position JSONB NOT NULL,
  target JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Inserção Segura do Bucket de Armazenamento para Arquivos Pesados 3D
INSERT INTO storage.buckets (id, name, public) 
VALUES ('atlas-3d-models', 'atlas-3d-models', true)
ON CONFLICT (id) DO NOTHING;

-- Habilita RLS para segurança estrita
ALTER TABLE IF EXISTS public.atlas_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.atlas_3d_markers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Políticas para `atlas_3d_models`
-- A. Administradores (super_admin, admin) podem gerenciar o acervo por inteiro
CREATE POLICY "Admin full access models" ON public.atlas_3d_models
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- B. Visualização Condicional: Modelos publicados globais ou vinculados a uma instituição
CREATE POLICY "Users can read published and allowed models" ON public.atlas_3d_models
  FOR SELECT
  USING (
    status = 'published'
    AND (
      institution_id IS NULL OR 
      institution_id = (SELECT institution FROM public.users WHERE id = auth.uid()::text)
    )
  );

-- 5. RLS Políticas para `atlas_3d_markers`
-- A. Administradores podem gerenciar marcadores livremente
CREATE POLICY "Admin full access markers" ON public.atlas_3d_markers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- B. Marcadores só são visíveis se o modelo pai estiver publicado e pertencer à instituição
CREATE POLICY "Users can read markers of published models" ON public.atlas_3d_markers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.atlas_3d_models m
      WHERE m.id = public.atlas_3d_markers.model_id
        AND m.status = 'published'
        AND (m.institution_id IS NULL OR m.institution_id = (SELECT institution FROM public.users WHERE id = auth.uid()::text))
    )
  );

-- 6. Políticas de RLS para o Supabase Storage (`atlas-3d-models`)
-- A. Apenas administradores podem gravar arquivos pesados (.glb, .obj)
CREATE POLICY "Admin upload access" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'atlas-3d-models' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- B. Usuários logados e assinantes podem ler os modelos (via fetch do WebGL)
CREATE POLICY "Public read access to 3d models" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'atlas-3d-models' AND auth.role() = 'authenticated'
  );
