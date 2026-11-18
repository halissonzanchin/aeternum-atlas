-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO MASTER P0.17
-- MIGRATION: 20261118120000_p0_16_academic_metrics_expansion.sql
-- 
-- EXPANSÃO DE SCHEMA: Telemetria Acadêmica Canônica, Persistência Multi-Dispositivo
-- de Modelos e Flashcards, Tríade de Desempenho por Sistema e RPCs Agregadoras.
-- 
-- PADRÃO ARQUITETURAL: Expand/Contract (Fase Expand Aditiva e Não-Destrutiva).
-- PADRÃO DE SEGURANÇA: Zero Trust, RLS Multi-Tenant, FIRST SESSION WINS Guard
-- e Interval Union Matemático via PostgreSQL range_agg.
-- ==============================================================================

-- 1. TABELA CANÔNICA DE PROGRESSO EM MODELOS ANATÔMICOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_model_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    model_id TEXT NOT NULL,
    system_id TEXT NOT NULL DEFAULT 'Geral',
    active_study_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_study_seconds >= 0),
    structures_explored JSONB NOT NULL DEFAULT '[]'::jsonb,
    structures_explored_count INTEGER NOT NULL DEFAULT 0 CHECK (structures_explored_count >= 0),
    structures_total_count INTEGER NOT NULL DEFAULT 0 CHECK (structures_total_count >= 0),
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
COMMENT ON COLUMN public.user_model_progress.structures_explored IS 'Array JSON de identificadores de anotações validadas inspecionadas no modelo';
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
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    card_id TEXT NOT NULL,
    deck_id TEXT NOT NULL DEFAULT 'default',
    topic TEXT NOT NULL DEFAULT 'Anatomia Geral',
    system_id TEXT DEFAULT 'Geral',
    rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'good', 'easy')),
    is_correct BOOLEAN NOT NULL,
    repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50 CHECK (ease_factor >= 1.30 AND ease_factor <= 3.50),
    interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 0),
    next_review_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_flashcard_reviews IS 'Histórico longitudinal de revisões espaçadas de flashcards (algoritmo SM-2)';

-- Índices de consulta longitudinal e deduplicação de estado recente
CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_id 
    ON public.user_flashcard_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_card_latest 
    ON public.user_flashcard_reviews(user_id, card_id, reviewed_at DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_flashcard_reviews_user_next 
    ON public.user_flashcard_reviews(user_id, next_review_at);


-- 3. POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
-- Integradas com First Session Wins (is_current_jwt_session_active) e Escopo Multi-Tenant
-- ------------------------------------------------------------------------------
ALTER TABLE public.user_model_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para user_model_progress
DROP POLICY IF EXISTS user_model_progress_select_own ON public.user_model_progress;
CREATE POLICY user_model_progress_select_own ON public.user_model_progress
    FOR SELECT TO authenticated
    USING (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND (
            auth.uid() = user_id 
            OR (public.is_admin_user() AND (institution_id IS NULL OR institution_id = public.get_current_user_institution_id()))
        )
    );

DROP POLICY IF EXISTS user_model_progress_insert_own ON public.user_model_progress;
CREATE POLICY user_model_progress_insert_own ON public.user_model_progress
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND auth.uid() = user_id
    );

DROP POLICY IF EXISTS user_model_progress_update_own ON public.user_model_progress;
CREATE POLICY user_model_progress_update_own ON public.user_model_progress
    FOR UPDATE TO authenticated
    USING (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND auth.uid() = user_id
    )
    WITH CHECK (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND auth.uid() = user_id
    );

DROP POLICY IF EXISTS user_model_progress_delete_own ON public.user_model_progress;
CREATE POLICY user_model_progress_delete_own ON public.user_model_progress
    FOR DELETE TO authenticated
    USING (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND (auth.uid() = user_id OR public.is_super_admin_user())
    );

-- Políticas para user_flashcard_reviews
DROP POLICY IF EXISTS user_flashcard_reviews_select_own ON public.user_flashcard_reviews;
CREATE POLICY user_flashcard_reviews_select_own ON public.user_flashcard_reviews
    FOR SELECT TO authenticated
    USING (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND (
            auth.uid() = user_id 
            OR (public.is_admin_user() AND (institution_id IS NULL OR institution_id = public.get_current_user_institution_id()))
        )
    );

DROP POLICY IF EXISTS user_flashcard_reviews_insert_own ON public.user_flashcard_reviews;
CREATE POLICY user_flashcard_reviews_insert_own ON public.user_flashcard_reviews
    FOR INSERT TO authenticated
    WITH CHECK (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND auth.uid() = user_id
    );

DROP POLICY IF EXISTS user_flashcard_reviews_delete_own ON public.user_flashcard_reviews;
CREATE POLICY user_flashcard_reviews_delete_own ON public.user_flashcard_reviews
    FOR DELETE TO authenticated
    USING (
        (auth.role() = 'service_role' OR public.is_current_jwt_session_active())
        AND (auth.uid() = user_id OR public.is_super_admin_user())
    );


-- 4. RPC: SINCRONIZAÇÃO ATÔMICA DE PROGRESSO DE MODELO
-- Protegida por First Session Wins, Bounded Checks contra manipulação e Concorrência
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
    v_clean_active_sec INTEGER;
    v_clean_total_count INTEGER;
BEGIN
    IF auth.role() <> 'service_role' THEN
        IF v_uid IS NULL THEN
            RAISE EXCEPTION 'Autenticação necessária para sincronizar progresso acadêmico.' USING ERRCODE = '42501';
        END IF;

        -- Proteção de Sessão: FIRST SESSION WINS & Inatividade
        IF NOT public.is_current_jwt_session_active() THEN
            RAISE EXCEPTION 'Acesso negado: sessão inativa ou sobreposta por outro dispositivo (First Session Wins).' 
            USING ERRCODE = '42501';
        END IF;
    END IF;

    -- Sanitização e Limites de Integridade (máximo 4 horas por sync e 2000 estruturas)
    v_clean_active_sec := LEAST(GREATEST(0, COALESCE(p_additional_active_seconds, 0)), 14400);
    v_clean_total_count := LEAST(GREATEST(0, COALESCE(p_structures_total_count, 0)), 2000);

    SELECT institution_id INTO v_inst_id FROM public.users WHERE id = v_uid;

    -- Obter registro existente com Lock de Linha (FOR UPDATE) para prevenir corrida concorrente
    SELECT * INTO v_existing FROM public.user_model_progress 
    WHERE user_id = v_uid AND model_id = p_model_id
    FOR UPDATE;

    IF FOUND THEN
        -- Fundir estruturas exploradas sem duplicatas
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
            active_study_seconds = v_existing.active_study_seconds + v_clean_active_sec,
            structures_explored = v_merged_structures,
            structures_explored_count = v_explored_count,
            structures_total_count = GREATEST(v_existing.structures_total_count, v_clean_total_count),
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
            'structures_explored_count', v_explored_count,
            'active_study_seconds', v_existing.active_study_seconds + v_clean_active_sec
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
            v_clean_active_sec,
            v_merged_structures,
            v_explored_count,
            v_clean_total_count,
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
            'structures_explored_count', v_explored_count,
            'active_study_seconds', v_clean_active_sec
        );
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_student_model_progress FROM public, anon;
GRANT EXECUTE ON FUNCTION public.sync_student_model_progress TO authenticated, service_role;


-- 5. RPC: RESUMO ACADÊMICO CONSOLIDADO (SINGLE ROUNDTRIP)
-- Executa agregação no servidor com união de intervalos e isolamento institucional
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
    IF auth.role() <> 'service_role' THEN
        IF v_uid IS NULL THEN
            RAISE EXCEPTION 'Acesso negado: sessão não autenticada.' USING ERRCODE = '42501';
        END IF;

        -- Proteção de Sessão: FIRST SESSION WINS
        IF NOT public.is_current_jwt_session_active() THEN
            RAISE EXCEPTION 'Acesso negado: sessão inativa ou sobreposta por outro dispositivo.' USING ERRCODE = '42501';
        END IF;

        -- Validação de isolamento entre estudantes e escopo institucional
        IF v_target_user <> v_uid THEN
            IF NOT public.is_admin_user() THEN
                RAISE EXCEPTION 'Acesso negado: não é permitido visualizar métricas de outro estudante.' USING ERRCODE = '42501';
            END IF;

            -- Administrador Institucional só pode consultar estudantes da sua própria instituição
            IF NOT public.is_super_admin_user() THEN
                DECLARE
                    v_caller_inst UUID := public.get_current_user_institution_id();
                    v_target_inst UUID;
                BEGIN
                    SELECT institution_id INTO v_target_inst FROM public.users WHERE id = v_target_user;
                    IF v_caller_inst IS NULL OR v_target_inst IS NULL OR v_caller_inst <> v_target_inst THEN
                        RAISE EXCEPTION 'Acesso negado: administrador institucional não possui escopo sobre estudante de outra instituição.' USING ERRCODE = '42501';
                    END IF;
                END;
            END IF;
        END IF;
    END IF;

    IF v_target_user IS NULL THEN
        RAISE EXCEPTION 'Usuário de destino não informado.' USING ERRCODE = '42501';
    END IF;

    -- 1. Tempo ativo deduplicado por união matemática de intervalos (Interval Union via range_agg)
    WITH session_ranges AS (
        SELECT 
            tstzrange(
                session_start, 
                session_start + make_interval(secs => LEAST(active_seconds, 14400))
            ) AS r,
            scope
        FROM public.viewer_learning_sessions
        WHERE user_id = v_target_user
          AND session_start >= v_cutoff
          AND (status <> 'abandoned' OR active_seconds > 0)
          AND active_seconds > 0
    ),
    merged_ranges AS (
        SELECT range_agg(r) AS mr FROM session_ranges
    )
    SELECT 
        COALESCE((
            SELECT SUM(EXTRACT(EPOCH FROM (upper(un) - lower(un))))::integer 
            FROM unnest(mr) AS un
        ), 0)
    INTO v_total_active_seconds
    FROM merged_ranges;

    -- Contagem de sessões válidas por escopo
    SELECT 
        COUNT(CASE WHEN scope = 'account' THEN 1 END),
        COUNT(CASE WHEN scope = 'viewer' THEN 1 END)
    INTO 
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

    -- 3. Flashcards e SRS (Revisões totais e pendências deduplicadas pela revisão mais recente de cada card)
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN is_correct THEN 1 END)
    INTO 
        v_flashcards_answered,
        v_flashcards_correct
    FROM public.user_flashcard_reviews
    WHERE user_id = v_target_user;

    SELECT COUNT(*)
    INTO v_pending_reviews
    FROM (
        SELECT DISTINCT ON (card_id) card_id, next_review_at
        FROM public.user_flashcard_reviews
        WHERE user_id = v_target_user
        ORDER BY card_id, reviewed_at DESC, created_at DESC
    ) latest_reviews
    WHERE next_review_at <= now();

    -- 4. Simulados deduplicados por ID único entre fontes
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
        UNION
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

REVOKE ALL ON FUNCTION public.get_student_academic_summary FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_student_academic_summary TO authenticated, service_role;
