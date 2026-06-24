-- Migration: Fix Atlas Models Institution Visibility RLS
-- Descrição: Substitui a leitura pública insegura por uma política que valida institution_availability
-- e cria funções helper para contexto do usuário, protegendo dados multi-institucionais.

-- 1. Criação de funções auxiliares seguras para recuperar o contexto do usuário autenticado
-- SECURITY DEFINER permite burlar RLS da tabela users para garantir que a própria política funcione.
-- SET search_path = public impede ataques de path override.

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

-- 2. Remoção das políticas antigas
DROP POLICY IF EXISTS "Public read for published models" ON public.atlas_models;
DROP POLICY IF EXISTS "Admin full access to models" ON public.atlas_models;

-- 3. Criação da Política Institucional Segura para atlas_models
CREATE POLICY "Institutional read for published models" ON public.atlas_models
FOR SELECT USING (
  status = 'published' AND (
    institution_availability ? 'global' OR 
    (public.current_user_institution_id() IS NOT NULL AND institution_availability ? (public.current_user_institution_id()::text))
  )
);

CREATE POLICY "Admin full access to models" ON public.atlas_models
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
);

-- 4. Remoção das políticas antigas dos assets e anotações
DROP POLICY IF EXISTS "Public read for assets of published models" ON public.atlas_model_assets;
DROP POLICY IF EXISTS "Admin full access to assets" ON public.atlas_model_assets;

DROP POLICY IF EXISTS "Public read for annotations of published models" ON public.atlas_model_annotations;
DROP POLICY IF EXISTS "Admin full access to annotations" ON public.atlas_model_annotations;

-- 5. Recriação segura para assets e anotações (cascade check via modelo)
CREATE POLICY "Institutional read for assets of published models" ON public.atlas_model_assets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.atlas_models m 
    WHERE m.id = atlas_model_assets.model_id AND m.status = 'published' AND (
      m.institution_availability ? 'global' OR 
      (public.current_user_institution_id() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
    )
  )
);

CREATE POLICY "Admin full access to assets" ON public.atlas_model_assets
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
);

CREATE POLICY "Institutional read for annotations of published models" ON public.atlas_model_annotations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.atlas_models m 
    WHERE m.id = atlas_model_annotations.model_id AND m.status = 'published' AND (
      m.institution_availability ? 'global' OR 
      (public.current_user_institution_id() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
    )
  )
);

CREATE POLICY "Admin full access to annotations" ON public.atlas_model_annotations
FOR ALL USING (
  public.current_user_role() IN ('admin', 'super_admin')
);

-- 6. Atualizar o modelo migrado ("Corte Sagital do Crânio Humano")
-- Para torná-lo disponível e testável como peça global oficial da biblioteca:
UPDATE public.atlas_models 
SET institution_availability = '["global"]'::jsonb
WHERE slug = 'corte-sagital-cranio-humano-superficial' OR slug = 'corte-sagital-cranio-humano';
