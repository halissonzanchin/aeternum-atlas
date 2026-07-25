-- Migration: Harden Atlas Models Visibility RLS
-- Descrição: Restringe alunos para verem apenas modelos publicados, não arquivados e não deletados da sua instituição.
-- Remove policies antigas que deixavam rascunhos ou lixeira vazar.

DROP POLICY IF EXISTS "Institutional read for published models" ON public.atlas_models;

-- 1. Criação da Política Institucional Segura Endurecida
CREATE POLICY "Institutional read for published models" ON public.atlas_models
FOR SELECT USING (
  status = 'published' 
  AND archived_at IS NULL 
  AND deleted_at IS NULL
  AND (
    institution_availability ? 'global' OR 
    (public.current_user_institution_id() IS NOT NULL AND institution_availability ? (public.current_user_institution_id()::text))
  )
);

-- Recria cascade para as anotações
DROP POLICY IF EXISTS "Institutional read for annotations of published models" ON public.atlas_model_annotations;
CREATE POLICY "Institutional read for annotations of published models" ON public.atlas_model_annotations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.atlas_models m 
    WHERE m.id = atlas_model_annotations.model_id 
    AND m.status = 'published' 
    AND m.archived_at IS NULL
    AND m.deleted_at IS NULL
    AND (
      m.institution_availability ? 'global' OR 
      (public.current_user_institution_id() IS NOT NULL AND m.institution_availability ? (public.current_user_institution_id()::text))
    )
  )
);
