-- PROPOSAL ONLY
-- DO NOT RUN IN PRODUCTION
-- DO NOT APPLY WITHOUT APPROVAL

-- 1. Novos campos para a tabela principal (atlas_models)
ALTER TABLE public.atlas_models
  ADD COLUMN IF NOT EXISTS viewer_engine TEXT DEFAULT 'atlas-native',
  ADD COLUMN IF NOT EXISTS default_viewer_engine TEXT DEFAULT 'atlas-native',
  ADD COLUMN IF NOT EXISTS embed_provider TEXT,
  ADD COLUMN IF NOT EXISTS embed_url TEXT,
  ADD COLUMN IF NOT EXISTS external_viewer_label TEXT,
  ADD COLUMN IF NOT EXISTS engine_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS engine_notice TEXT,
  ADD COLUMN IF NOT EXISTS native_engine_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS native_fallback_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS embed_sandbox_policy TEXT,
  ADD COLUMN IF NOT EXISTS embed_url_validated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS viewer_engine_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS viewer_engine_updated_by UUID REFERENCES public.users(id);

-- 2. Constraints para garantir a integridade do motor de visualização
ALTER TABLE public.atlas_models
  ADD CONSTRAINT chk_viewer_engine CHECK (viewer_engine IN ('atlas-native', 'sketchfab', 'hybrid')),
  ADD CONSTRAINT chk_default_viewer_engine CHECK (default_viewer_engine IN ('atlas-native', 'sketchfab')),
  ADD CONSTRAINT chk_embed_provider CHECK (embed_provider IS NULL OR embed_provider IN ('sketchfab')),
  ADD CONSTRAINT chk_engine_status CHECK (engine_status IN ('active', 'fallback', 'experimental', 'deprecated')),
  ADD CONSTRAINT chk_embed_url_format CHECK (
    embed_provider IS NULL OR 
    (embed_provider = 'sketchfab' AND embed_url LIKE 'https://sketchfab.com/models/%/embed%')
  ),
  ADD CONSTRAINT chk_atlas_native_default CHECK (
    viewer_engine != 'atlas-native' OR default_viewer_engine = 'atlas-native'
  ),
  ADD CONSTRAINT chk_hybrid_native_available CHECK (
    viewer_engine != 'hybrid' OR native_engine_available = true
  );

-- 3. Tabela de Auditoria
CREATE TABLE IF NOT EXISTS public.viewer_engine_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL REFERENCES public.atlas_models(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  old_viewer_engine TEXT,
  new_viewer_engine TEXT,
  old_default_viewer_engine TEXT,
  new_default_viewer_engine TEXT,
  old_embed_url TEXT,
  new_embed_url TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.viewer_engine_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. View Pública Segura
CREATE OR REPLACE VIEW public.public_model_viewer_config AS
SELECT 
  id,
  slug,
  title,
  description,
  -- Assume-se que o model_url possa vir de um join com atlas_model_assets ou que o model_lod_manifest está nela
  viewer_engine,
  default_viewer_engine,
  embed_provider,
  embed_url,
  native_engine_available,
  native_fallback_available,
  engine_status
FROM public.atlas_models
WHERE status = 'published';

-- 5. RLS em Pseudocódigo / Propostas Comentadas

-- Para viewer_engine_audit_logs:
-- Apenas Super Admins e Admins podem ler logs
-- CREATE POLICY "Admins can read audit logs" ON public.viewer_engine_audit_logs
--   FOR SELECT USING (
--     EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
--   );

-- Inserção de log apenas por trigger de backend ou Super Admins
-- CREATE POLICY "Admins can insert audit logs" ON public.viewer_engine_audit_logs
--   FOR INSERT WITH CHECK (
--     EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super_admin'))
--   );

-- Para a VIEW public_model_viewer_config:
-- A VIEW usa os privilégios de quem a chamou ou de quem a criou (SECURITY DEFINER/INVOKER).
-- Vamos conceder acesso de leitura para usuários autenticados institucionais:
-- GRANT SELECT ON public.public_model_viewer_config TO authenticated;
