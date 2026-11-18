-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO MASTER P0.16
-- ROLLBACK PLAN: rollback_20261118120000_p0_16_academic_metrics_expansion.sql
-- ==============================================================================

-- 1. Remoção de RPCs
DROP FUNCTION IF EXISTS public.get_student_academic_summary(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.sync_student_model_progress(TEXT, TEXT, INTEGER, TEXT[], INTEGER, BOOLEAN, BOOLEAN);

-- 2. Remoção de Tabelas e Políticas
DROP POLICY IF EXISTS user_flashcard_reviews_insert_own ON public.user_flashcard_reviews;
DROP POLICY IF EXISTS user_flashcard_reviews_select_own ON public.user_flashcard_reviews;
DROP TABLE IF EXISTS public.user_flashcard_reviews CASCADE;

DROP POLICY IF EXISTS user_model_progress_delete_own ON public.user_model_progress;
DROP POLICY IF EXISTS user_model_progress_update_own ON public.user_model_progress;
DROP POLICY IF EXISTS user_model_progress_insert_own ON public.user_model_progress;
DROP POLICY IF EXISTS user_model_progress_select_own ON public.user_model_progress;
DROP TABLE IF EXISTS public.user_model_progress CASCADE;
