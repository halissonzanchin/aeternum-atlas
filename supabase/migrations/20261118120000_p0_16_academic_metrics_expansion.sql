-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO MASTER P0.16
-- MIGRATION: 20261118120000_p0_16_academic_metrics_expansion.sql
-- 
-- EXPANSÃO DE SCHEMA: Telemetria Acadêmica Canônica, Persistência Multi-Dispositivo
-- de Modelos e Flashcards, Tríade de Maestria por Sistema e RPCs Agregadoras.
-- 
-- AMBIENTE: Desenvolvimento / Homologação (NÃO APLICAR DIRETAMENTE EM PRODUÇÃO).
-- PADRÃO ARQUITETURAL: Expand/Contract (Fase Expand Não-Destrutiva).
-- ==============================================================================

-- 1. TABELA CANÔNICA DE PROGRESSO EM MODELOS ANATÔMICOS
-- Substitui a dependência frágil de localStorage ('aeternum_completed_models', 'aeternum_favorites')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_model_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID,
    model_id TEXT NOT NULL,
    system_id TEXT NOT NULL DEFAULT 'Geral',
    active_study_seconds INTEGER NOT NULL DEFAULT 0,
    structures_explored JSONB NOT NULL DEFAULT '[]'::jsonb,
    structures_explored_count INTEGER NOT NULL DEFAULT 0,
    structures_total_count INTEGER NOT NULL DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_model_progress_user_model_unique UNIQUE (user_id, model_id)
);

-- Comentários semânticos
COMMENT ON TABLE public.user_model_progress IS 'Progresso de exploração, dissecção e favoritos do estudante em modelos anatômicos 3D';
COMMENT ON COLUMN public.user_model_progress.structures_explored IS 'Array JSON de identificadores ou índices de anotações inspecionadas no modelo';
COMMENT ON COLUMN public.user_model_progress.is_completed IS 'Indica se o modelo atendeu aos critérios objetivos de conclusão (tempo ativo + cobertura)';

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_user_model_progress_user_id 
    ON public.user_model_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_model_progress_user_system 
    ON public.user_model_progress(user_id, system_id);

CREATE INDEX IF NOT EXISTS idx_user_model_progress_user_favorite 
    ON public.user_model_progress(user_id) WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_model_progress_last_access 
    ON public.user_model_progress(user_id, last_accessed_at DESC);


-- 2. TABELA CANÔNICA DE REVISÕES LONGITUDINAIS DE FLASHCARDS (SRS)
-- Registra o histórico longitudinal do algoritmo SM-2 para comprovação científica de retenção
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID,
    card_id TEXT NOT NULL,
    deck_id TEXT NOT NULL DEFAULT 'default',
    topic TEXT NOT NULL DEFAULT 'Anatomia Geral',
    system_id TEXT DEFAULT 'Geral',
    rating TEXT NOT NULL, -- 'again', 'hard', 'good', 'easy'
    is_correct BOOLEAN NOT NULL,
    repetitions INTEGER NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    interval_days INTEGER NOT NULL DEFAULT 1,
    next_review_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_flashcard_reviews IS 'Histórico longitudinal de revisões espaçadas de flashcards (algoritmo SM-2)';

-- Índices de consulta longitudinal
CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_id 
    ON public.user_flashcard_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_topic 
    ON public.user_flashcard_reviews(user_id, topic);

CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_next 
    ON public.user_flashcard_reviews(user_id, next_review_at);


-- 3. POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_model_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para user_model_progress
DROP POLICY IF EXISTS user_model_progress_select_own ON public.user_model_progress;
CREATE POLICY user_model_progress_select_own ON public.user_model_progress
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR (auth.role() = 'service_role')
        OR (public.is_admin_user() AND (institution_id IS NULL OR institution_id = public.get_current_user_institution_id()))
    );

DROP POLICY IF EXISTS user_model_progress_insert_own ON public.user_model_progress;
CREATE POLICY user_model_progress_insert_own ON public.user_model_progress
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS user_model_progress_update_own ON public.user_model_progress;
CREATE POLICY user_model_progress_update_own ON public.user_model_progress
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS user_model_progress_delete_own ON public.user_model_progress;
CREATE POLICY user_model_progress_delete_own ON public.user_model_progress
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Políticas para user_flashcard_reviews
DROP POLICY IF EXISTS user_flashcard_reviews_select_own ON public.user_flashcard_reviews;
CREATE POLICY user_flashcard_reviews_select_own ON public.user_flashcard_reviews
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR (auth.role() = 'service_role')
        OR (public.is_admin_user() AND (institution_id IS NULL OR institution_id = public.get_current_user_institution_id()))
    );

DROP POLICY IF EXISTS user_flashcard_reviews_insert_own ON public.user_flashcard_reviews;
CREATE POLICY user_flashcard_reviews_insert_own ON public.user_flashcard_reviews
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');


-- 4. RPC: SINCRONIZAÇÃO ATÔMICA DE PROGRESSO DE MODELO
-- Permite que o cliente web sincronize status sem sobrescrever dados mais recentes
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_student_model_progress(
    p_model_id TEXT,
    p_system_id TEXT,
    p_additional_active_seconds INTEGER DEFAULT 0,
    p_structures_explored TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_structures_total_count INTEGER DEFAULT 0,
    p_is_favorite BOOLEAN DEFAULT NULL,
    p_is_completed BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_inst_id UUID;
    v_existing public.user_model_progress%ROWTYPE;
    v_merged_structures JSONB;
    v_explored_count INTEGER;
    v_fav BOOLEAN;
    v_comp BOOLEAN;
    v_comp_at TIMESTAMPTZ;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária para sincronizar progresso acadêmico.';
    END IF;

    SELECT institution_id INTO v_inst_id FROM public.users WHERE id = v_uid;

    -- Obter registro existente se houver
    SELECT * INTO v_existing FROM public.user_model_progress 
    WHERE user_id = v_uid AND model_id = p_model_id;

    IF FOUND THEN
        -- Fundir estruturas exploradas
        SELECT jsonb_agg(DISTINCT elem) INTO v_merged_structures
        FROM (
            SELECT jsonb_array_elements_text(v_existing.structures_explored) AS elem
            UNION
            SELECT unnest(p_structures_explored) AS elem
        ) s
        WHERE elem IS NOT NULL AND elem <> '';

        IF v_merged_structures IS NULL THEN
            v_merged_structures := '[]'::jsonb;
        END IF;

        v_explored_count := jsonb_array_length(v_merged_structures);
        v_fav := COALESCE(p_is_favorite, v_existing.is_favorite);
        v_comp := COALESCE(p_is_completed, v_existing.is_completed);
        v_comp_at := CASE WHEN v_comp AND v_existing.completed_at IS NULL THEN now() ELSE v_existing.completed_at END;

        UPDATE public.user_model_progress
        SET 
            system_id = COALESCE(NULLIF(p_system_id, ''), v_existing.system_id),
            active_study_seconds = v_existing.active_study_seconds + GREATEST(0, p_additional_active_seconds),
            structures_explored = v_merged_structures,
            structures_explored_count = v_explored_count,
            structures_total_count = GREATEST(v_existing.structures_total_count, p_structures_total_count),
            is_favorite = v_fav,
            is_completed = v_comp,
            completed_at = v_comp_at,
            last_accessed_at = now(),
            updated_at = now()
        WHERE id = v_existing.id;

        RETURN jsonb_build_object(
            'status', 'updated',
            'model_id', p_model_id,
            'is_favorite', v_fav,
            'is_completed', v_comp,
            'structures_explored_count', v_explored_count
        );
    ELSE
        -- Inserção de novo registro
        SELECT jsonb_agg(DISTINCT elem) INTO v_merged_structures
        FROM (SELECT unnest(p_structures_explored) AS elem) s
        WHERE elem IS NOT NULL AND elem <> '';

        IF v_merged_structures IS NULL THEN
            v_merged_structures := '[]'::jsonb;
        END IF;

        v_explored_count := jsonb_array_length(v_merged_structures);
        v_fav := COALESCE(p_is_favorite, FALSE);
        v_comp := COALESCE(p_is_completed, FALSE);
        v_comp_at := CASE WHEN v_comp THEN now() ELSE NULL END;

        INSERT INTO public.user_model_progress (
            user_id,
            institution_id,
            model_id,
            system_id,
            active_study_seconds,
            structures_explored,
            structures_explored_count,
            structures_total_count,
            is_favorite,
            is_completed,
            completed_at,
            last_accessed_at
        ) VALUES (
            v_uid,
            v_inst_id,
            p_model_id,
            COALESCE(NULLIF(p_system_id, ''), 'Geral'),
            GREATEST(0, p_additional_active_seconds),
            v_merged_structures,
            v_explored_count,
            GREATEST(0, p_structures_total_count),
            v_fav,
            v_comp,
            v_comp_at,
            now()
        );

        RETURN jsonb_build_object(
            'status', 'created',
            'model_id', p_model_id,
            'is_favorite', v_fav,
            'is_completed', v_comp,
            'structures_explored_count', v_explored_count
        );
    END IF;
END;
$$;


-- 5. RPC: RESUMO ACADÊMICO CONSOLIDADO (SINGLE ROUNDTRIP)
-- Executa toda a agregação no servidor em menos de 50ms, evitando transferir milhares de linhas ao cliente
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_academic_summary(
    p_user_id UUID DEFAULT auth.uid(),
    p_window_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_target_user UUID := COALESCE(p_user_id, v_uid);
    v_cutoff TIMESTAMPTZ := now() - (GREATEST(1, p_window_days) || ' days')::interval;
    v_total_active_seconds INTEGER := 0;
    v_account_sessions_count INTEGER := 0;
    v_viewer_sessions_count INTEGER := 0;
    v_distinct_models_explored INTEGER := 0;
    v_total_structures_explored INTEGER := 0;
    v_flashcards_answered INTEGER := 0;
    v_flashcards_correct INTEGER := 0;
    v_pending_reviews INTEGER := 0;
    v_quiz_attempts INTEGER := 0;
    v_quiz_questions INTEGER := 0;
    v_quiz_hits INTEGER := 0;
    v_tutor_conversations_count INTEGER := 0;
    v_data_state TEXT := 'SEM_HISTORICO';
    v_systems JSONB;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: sessão não autenticada.';
    END IF;

    -- Validação de isolamento entre estudantes
    IF v_target_user <> v_uid AND NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Acesso negado: não é permitido visualizar métricas de outro estudante.';
    END IF;

    -- 1. Tempo ativo deduplicado e sessões
    SELECT 
        COALESCE(SUM(active_seconds), 0),
        COUNT(CASE WHEN scope = 'account' THEN 1 END),
        COUNT(CASE WHEN scope = 'viewer' THEN 1 END)
    INTO 
        v_total_active_seconds,
        v_account_sessions_count,
        v_viewer_sessions_count
    FROM public.viewer_learning_sessions
    WHERE user_id = v_target_user
      AND session_start >= v_cutoff
      AND (status <> 'abandoned' OR active_seconds > 0);

    -- 2. Exploração 3D em user_model_progress
    SELECT 
        COUNT(*),
        COALESCE(SUM(structures_explored_count), 0)
    INTO 
        v_distinct_models_explored,
        v_total_structures_explored
    FROM public.user_model_progress
    WHERE user_id = v_target_user;

    -- 3. Flashcards e SRS
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN is_correct THEN 1 END),
        COUNT(CASE WHEN next_review_at <= now() THEN 1 END)
    INTO 
        v_flashcards_answered,
        v_flashcards_correct,
        v_pending_reviews
    FROM public.user_flashcard_reviews
    WHERE user_id = v_target_user;

    -- 4. Simulados (viewer_quiz_results + anatomical_quiz_attempts)
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(total_questions), 0),
        COALESCE(SUM(score), 0)
    INTO 
        v_quiz_attempts,
        v_quiz_questions,
        v_quiz_hits
    FROM (
        SELECT id, total_questions, score FROM public.viewer_quiz_results WHERE user_id = v_target_user
        UNION ALL
        SELECT id, total_questions, score FROM public.anatomical_quiz_attempts WHERE user_id = v_target_user
    ) q;

    -- 5. Interações com Tutor IA
    SELECT COUNT(*) INTO v_tutor_conversations_count
    FROM public.ai_conversations
    WHERE user_id = v_target_user;

    -- 6. Agrupamento por Sistema Anatômico
    SELECT COALESCE(jsonb_agg(sys_row), '[]'::jsonb) INTO v_systems
    FROM (
        SELECT 
            system_id AS system_name,
            COUNT(*) AS models_count,
            SUM(structures_explored_count) AS structures_inspected,
            SUM(structures_total_count) AS structures_total,
            CASE 
                WHEN SUM(structures_total_count) > 0 
                THEN LEAST(100, ROUND((SUM(structures_explored_count)::numeric / SUM(structures_total_count)::numeric) * 100))
                ELSE 0 
            END AS exploration_coverage_percent
        FROM public.user_model_progress
        WHERE user_id = v_target_user
        GROUP BY system_id
        ORDER BY structures_inspected DESC
    ) sys_row;

    -- 7. Determinar Estado de Dados
    IF v_total_active_seconds = 0 AND v_distinct_models_explored = 0 AND v_flashcards_answered = 0 AND v_quiz_attempts = 0 THEN
        v_data_state := 'SEM_HISTORICO';
    ELSIF v_total_active_seconds >= 300 AND v_distinct_models_explored >= 1 AND (v_flashcards_answered > 0 OR v_quiz_attempts > 0) THEN
        v_data_state := 'DADOS_DISPONIVEIS';
    ELSE
        v_data_state := 'DADOS_PARCIAIS';
    END IF;

    RETURN jsonb_build_object(
        'data_state', v_data_state,
        'window_days', p_window_days,
        'user_id', v_target_user,
        'time', jsonb_build_object(
            'total_active_seconds', v_total_active_seconds,
            'total_active_minutes', ROUND(v_total_active_seconds / 60),
            'total_active_hours', ROUND((v_total_active_seconds::numeric / 3600.0), 1),
            'account_sessions', v_account_sessions_count,
            'viewer_sessions', v_viewer_sessions_count
        ),
        'exploration_3d', jsonb_build_object(
            'distinct_models', v_distinct_models_explored,
            'structures_explored', v_total_structures_explored
        ),
        'flashcards', jsonb_build_object(
            'cards_answered', v_flashcards_answered,
            'accuracy_percent', CASE WHEN v_flashcards_answered > 0 THEN ROUND((v_flashcards_correct::numeric / v_flashcards_answered::numeric) * 100) ELSE 0 END,
            'pending_reviews', v_pending_reviews
        ),
        'quizzes', jsonb_build_object(
            'attempts_count', v_quiz_attempts,
            'questions_count', v_quiz_questions,
            'hits_count', v_quiz_hits,
            'weighted_accuracy_percent', CASE WHEN v_quiz_questions > 0 THEN ROUND((v_quiz_hits::numeric / v_quiz_questions::numeric) * 100) ELSE NULL END
        ),
        'tutor_ia', jsonb_build_object(
            'clinical_conversations_count', v_tutor_conversations_count
        ),
        'systems', v_systems
    );
END;
$$;
