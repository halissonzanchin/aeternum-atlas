-- 20260621000001_atlas_model_assets_persistence.sql
-- Phase 7.3E: Supabase Storage & Annotation Persistence

-- 1. Criação do Bucket de Armazenamento para Assets (GLB, OBJ)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('atlas-model-assets', 'atlas-model-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela de Modelos 3D Oficial (Nova Nomenclatura)
CREATE TABLE IF NOT EXISTS public.atlas_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  anatomical_system TEXT,
  anatomical_region TEXT,
  difficulty_level TEXT,
  estimated_time INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  viewer_type TEXT NOT NULL DEFAULT 'atlas-native',
  sketchfab_url TEXT,
  institution_availability JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Assets 3D associada ao modelo
CREATE TABLE IF NOT EXISTS public.atlas_model_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.atlas_models(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_format TEXT NOT NULL, -- 'glb', 'obj', 'gltf'
  file_size BIGINT NOT NULL,
  asset_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Anotações (Marcadores)
CREATE TABLE IF NOT EXISTS public.atlas_model_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.atlas_models(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position JSONB NOT NULL,
  camera_position JSONB NOT NULL,
  target JSONB NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS
ALTER TABLE public.atlas_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_model_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atlas_model_annotations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para atlas_models
CREATE POLICY "Public read for published models" ON public.atlas_models
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin full access to models" ON public.atlas_models
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- Políticas de RLS para atlas_model_assets
CREATE POLICY "Public read for assets of published models" ON public.atlas_model_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.atlas_models m 
      WHERE m.id = atlas_model_assets.model_id AND m.status = 'published'
    )
  );

CREATE POLICY "Admin full access to assets" ON public.atlas_model_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- Políticas de RLS para atlas_model_annotations
CREATE POLICY "Public read for annotations of published models" ON public.atlas_model_annotations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.atlas_models m 
      WHERE m.id = atlas_model_annotations.model_id AND m.status = 'published'
    )
  );

CREATE POLICY "Admin full access to annotations" ON public.atlas_model_annotations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

-- Políticas de RLS para o Storage (Bucket atlas-model-assets)
CREATE POLICY "Admin upload access to assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'atlas-model-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid()::text AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public read access to assets bucket" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'atlas-model-assets'
  );
