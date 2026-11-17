-- ==============================================================================
-- AETERNUM ATLAS — P0.13.1 NON-DESTRUCTIVE ROLLBACK PLAN
-- Rollback for: 20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql
-- Guarantee: ZERO tables dropped, ZERO columns dropped, ZERO audit rows deleted.
--            Removes AS RESTRICTIVE RLS policies and restores P0.3 function definitions.
-- ==============================================================================

BEGIN;

-- 1. Remove AS RESTRICTIVE session guard policies from academic tables
DO $$
DECLARE
    v_tbl text;
    v_academic_tables text[] := ARRAY[
        'ai_conversations',
        'ai_messages',
        'ai_audit_events',
        'anatomical_quiz_attempts',
        'anatomical_quiz_answers',
        'anatomical_quizzes',
        'anatomical_quiz_questions',
        'study_agenda',
        'study_agenda_events',
        'viewer_learning_sessions',
        'viewer_learning_events',
        'viewer_quiz_results',
        'vita_tutor_memory',
        'student_profiles',
        'models_3d',
        'atlas_models',
        'atlas_model_assets',
        'atlas_model_annotations',
        'model_annotations'
    ];
BEGIN
    FOREACH v_tbl IN ARRAY v_academic_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = v_tbl
        ) THEN
            EXECUTE format('DROP POLICY IF EXISTS session_guard_enforce_active_jwt_session ON public.%I;', v_tbl);
        END IF;
    END LOOP;
END;
$$;

-- 2. Remove automatic qualified activity triggers
DO $$
DECLARE
    v_tbl text;
BEGIN
    FOREACH v_tbl IN ARRAY ARRAY[
        'ai_conversations',
        'ai_messages',
        'anatomical_quiz_attempts',
        'anatomical_quiz_answers',
        'viewer_quiz_results',
        'study_agenda_events',
        'viewer_learning_sessions',
        'viewer_learning_events'
    ]
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = v_tbl
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_session_guard_qualified_activity ON public.%I;', v_tbl);
        END IF;
    END LOOP;
END;
$$;

-- 3. Restore SELECT policies on session tables
DROP POLICY IF EXISTS user_active_sessions_select_own ON public.user_active_sessions;
CREATE POLICY user_active_sessions_select_own
    ON public.user_active_sessions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS session_guard_events_select_own ON public.session_guard_events;
CREATE POLICY session_guard_events_select_own
    ON public.session_guard_events
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS ai_rate_limits_select_own ON public.ai_rate_limits;
CREATE POLICY ai_rate_limits_select_own
    ON public.ai_rate_limits
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 4. Drop new P0.13.1 helper functions and 4-arg validate_session_guard overload
DROP FUNCTION IF EXISTS public.touch_session_on_academic_write();
DROP FUNCTION IF EXISTS public.record_qualified_activity(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.validate_session_guard(uuid, boolean, text, text);
DROP FUNCTION IF EXISTS public.is_current_jwt_session_active();
DROP FUNCTION IF EXISTS public.is_qualified_activity_type(text);
DROP FUNCTION IF EXISTS public.sanitize_device_fingerprint(text);
DROP FUNCTION IF EXISTS public.session_guard_now();
DROP TABLE IF EXISTS private.session_guard_test_clock;

-- 5. Normalize any 'released' status back to 'revoked' if rolling back to legacy constraint
UPDATE public.user_active_sessions
SET status = 'revoked',
    revoked_reason = COALESCE(revoked_reason, 'user_logout')
WHERE status = 'released';

COMMIT;
