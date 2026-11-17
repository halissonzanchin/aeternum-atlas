-- ==============================================================================
-- AETERNUM ATLAS — P0.13.1: FIRST SESSION WINS + INACTIVITY TIMEOUT 60 MINUTES
-- Migration: 20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql
-- Description: Replaces the legacy session transfer policy with strict
--              FIRST SESSION WINS priority and a server-authoritative 60-minute
--              qualified inactivity timeout.
--              - Enforces per-user atomic transactional locking via pg_advisory_xact_lock
--                even when no row exists yet in user_active_sessions.
--              - Strictly separates last_presence_check_at from last_qualified_activity_at.
--              - Prevents heartbeats, JWT refreshes, polling, health checks, session syncs,
--                and refused login attempts from resetting the 60-minute inactivity window.
--              - Refuses secondary sessions with SESSION_ALREADY_ACTIVE without modifying
--                any timestamp or column of the primary active session.
--              - Protects academic tables via AS RESTRICTIVE RLS policies and guards RPCs
--                so a second or expired JWT cannot bypass the UI to query/mutate data.
--              - Preserves all existing tables and audit history non-destructively.
-- Pre-conditions: 20261116010000_aeternum_session_guard_single_session_policy.sql applied.
-- Rollback Plan: supabase/rollback-plans/rollback_20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PRIVATE CONTROLLED CLOCK INFRASTRUCTURE (SERVER-AUTHORITATIVE)
-- In production, private.session_guard_test_clock is empty and session_guard_now()
-- always returns PostgreSQL server now(). In disposable test environments, the
-- superuser test harness can set override_now to deterministically verify 59m59s
-- and 60m00s boundaries without waiting 60 real minutes.
-- ------------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.session_guard_test_clock (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    override_now timestamptz NOT NULL
);

REVOKE ALL ON TABLE private.session_guard_test_clock FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.session_guard_now()
RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public, pg_temp
AS $$
    SELECT COALESCE(
        (SELECT override_now FROM private.session_guard_test_clock WHERE id = 1),
        now()
    );
$$;

REVOKE ALL ON FUNCTION public.session_guard_now() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.session_guard_now() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 2. DATA MINIMIZATION & QUALIFIED ACTIVITY CLASSIFICATION HELPERS
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sanitize_device_fingerprint(p_raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
    SELECT CASE
        WHEN p_raw IS NULL OR btrim(p_raw) = '' THEN NULL
        WHEN p_raw ~ '^fp_[0-9a-f]{16}$' THEN p_raw
        ELSE 'fp_' || substr(md5(btrim(p_raw)), 1, 16)
    END;
$$;

REVOKE ALL ON FUNCTION public.sanitize_device_fingerprint(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sanitize_device_fingerprint(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_qualified_activity_type(p_activity_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
    SELECT lower(btrim(COALESCE(p_activity_type, ''))) = ANY (ARRAY[
        'form_tool_interaction',
        'ai_tutor_query',
        'quiz_answer_submission',
        'flashcard_review',
        'agenda_edit',
        'model_3d_interaction',
        'active_navigation_reading',
        'educational_progress'
    ]);
$$;

REVOKE ALL ON FUNCTION public.is_qualified_activity_type(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_qualified_activity_type(text) TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. NON-DESTRUCTIVE SCHEMA EVOLUTION: user_active_sessions & session_guard_events
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_active_sessions
    ADD COLUMN IF NOT EXISTS last_qualified_activity_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_presence_check_at timestamptz,
    ADD COLUMN IF NOT EXISTS inactivity_timeout_minutes integer NOT NULL DEFAULT 60,
    ADD COLUMN IF NOT EXISTS last_activity_type text,
    ADD COLUMN IF NOT EXISTS released_at timestamptz,
    ADD COLUMN IF NOT EXISTS expired_at timestamptz,
    ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

-- Safe Rollout Backfill: active sessions receive a full 60-minute window starting
-- at GREATEST(last_active_at, now()) so no legitimate student is displaced during rollout.
-- Also anonymize any legacy raw fingerprints in-place.
UPDATE public.user_active_sessions
SET last_qualified_activity_at = CASE
        WHEN status = 'active' THEN GREATEST(COALESCE(last_active_at, created_at, now()), now())
        ELSE COALESCE(last_qualified_activity_at, last_active_at, created_at, now())
    END,
    last_presence_check_at = COALESCE(last_presence_check_at, last_active_at, created_at, now()),
    inactivity_timeout_minutes = 60,
    last_activity_type = COALESCE(last_activity_type, 'rollout_migration_preserved'),
    device_fingerprint = public.sanitize_device_fingerprint(device_fingerprint),
    ip_address = NULL;

ALTER TABLE public.user_active_sessions
    ALTER COLUMN last_qualified_activity_at SET DEFAULT now(),
    ALTER COLUMN last_qualified_activity_at SET NOT NULL,
    ALTER COLUMN last_presence_check_at SET DEFAULT now(),
    ALTER COLUMN last_presence_check_at SET NOT NULL;

ALTER TABLE public.user_active_sessions
    DROP CONSTRAINT IF EXISTS user_active_sessions_status_check;

ALTER TABLE public.user_active_sessions
    ADD CONSTRAINT user_active_sessions_status_check
    CHECK (status IN ('active', 'released', 'expired', 'revoked', 'displaced'));

ALTER TABLE public.user_active_sessions
    DROP CONSTRAINT IF EXISTS user_active_sessions_timeout_60m_check;

ALTER TABLE public.user_active_sessions
    ADD CONSTRAINT user_active_sessions_timeout_60m_check
    CHECK (inactivity_timeout_minutes = 60);

CREATE INDEX IF NOT EXISTS idx_user_active_sessions_qualified_activity
    ON public.user_active_sessions(last_qualified_activity_at);

-- Anonymize any legacy raw fingerprints in session_guard_events
UPDATE public.session_guard_events
SET device_fingerprint = public.sanitize_device_fingerprint(device_fingerprint),
    ip_address = NULL
WHERE device_fingerprint IS NOT NULL AND device_fingerprint !~ '^fp_[0-9a-f]{16}$';

ALTER TABLE public.session_guard_events
    DROP CONSTRAINT IF EXISTS session_guard_events_event_type_check;

ALTER TABLE public.session_guard_events
    ADD CONSTRAINT session_guard_events_event_type_check
    CHECK (event_type IN (
        -- Canonical P0.13.1 State Machine & Audit Event Codes
        'session_granted',
        'session_valid',
        'session_already_active',
        'session_expired_inactivity',
        'session_released',
        'session_revoked',
        'session_guard_unavailable',
        'qualified_activity_recorded',
        'access_denied_inactive_session',
        -- Historical Event Codes Preserved for Audit Integrity
        'session_registered',
        'session_confirmed',
        'session_transferred',
        'session_displaced',
        'access_denied_displaced',
        'access_denied_mismatch',
        'inactivity_expired',
        'transfer_limit_exceeded',
        'transfer_confirmation_required',
        'rate_limit_exceeded',
        'account_suspended',
        'admin_reset'
    ));

-- Enable Session Guard universally by default for accounts
ALTER TABLE public.users
    ALTER COLUMN session_guard_enabled SET DEFAULT true;

UPDATE public.users
SET session_guard_enabled = true
WHERE session_guard_enabled IS DISTINCT FROM true;


-- ------------------------------------------------------------------------------
-- 4. SERVER-SIDE ACTIVE SESSION PREDICATE (NON-RECURSIVE SECURITY DEFINER)
-- Used by RESTRICTIVE RLS policies and RPCs to guarantee that auth.uid() alone
-- is NOT sufficient: the caller's JWT session_id must match the active,
-- non-expired session in public.user_active_sessions.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_current_jwt_session_active()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_caller_role text;
    v_user_id uuid;
    v_jwt_session_id uuid;
    v_user_status text;
    v_guard_enabled boolean;
    v_session_row public.user_active_sessions%ROWTYPE;
    v_now timestamptz;
BEGIN
    v_caller_role := auth.role();
    IF v_caller_role = 'service_role' THEN
        RETURN true;
    END IF;

    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT status, COALESCE(session_guard_enabled, true)
    INTO v_user_status, v_guard_enabled
    FROM public.users
    WHERE id = v_user_id;

    IF v_user_status IS NOT NULL AND NOT (lower(v_user_status) = ANY(ARRAY['active', 'ativo'])) THEN
        RETURN false;
    END IF;

    IF COALESCE(v_guard_enabled, true) IS FALSE THEN
        RETURN true;
    END IF;

    v_jwt_session_id := NULLIF(auth.jwt() ->> 'session_id', '')::uuid;
    IF v_jwt_session_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT * INTO v_session_row
    FROM public.user_active_sessions
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    IF v_session_row.session_id <> v_jwt_session_id THEN
        RETURN false;
    END IF;

    IF v_session_row.status <> 'active' THEN
        RETURN false;
    END IF;

    v_now := public.session_guard_now();
    IF v_now >= (v_session_row.last_qualified_activity_at + interval '60 minutes') THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.is_current_jwt_session_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_jwt_session_active() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 5. ATOMIC FIRST-SESSION-WINS REGISTRATION ROUTINE
--    - Acquires per-user transactional advisory lock before reading/inserting.
--    - Validates session_id exclusively from authenticated JWT claims.
--    - Never allows a second session to displace an active, non-expired first session.
--    - Never modifies timestamps of the active first session when refusing a second login.
--    - Automatically grants ownership if previous session is released, revoked,
--      expired, or has reached >= 60 minutes without qualified activity.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_or_transfer_session(
    p_session_id uuid DEFAULT NULL,
    p_device_fingerprint text DEFAULT NULL,
    p_ip text DEFAULT NULL,
    p_confirm_transfer boolean DEFAULT false,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_now timestamptz := public.session_guard_now();
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_role text;
    v_status text;
    v_license_tier text;
    v_session_guard_enabled boolean;
    v_inactivity_minutes constant integer := 60;
    v_safe_fingerprint text;
    v_record public.user_active_sessions%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'status', 'SESSION_GUARD_UNAVAILABLE',
            'code', 'SESSION_GUARD_UNAVAILABLE',
            'reason', 'AUTH_REQUIRED',
            'valid', false,
            'allowed', false,
            'error', 'Autenticação obrigatória para registrar sessão.'
        );
    END IF;

    -- 1. Validate session_id strictly from authenticated JWT claim
    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;
    v_safe_fingerprint := public.sanitize_device_fingerprint(p_device_fingerprint);

    IF v_caller_role = 'authenticated' THEN
        IF v_jwt_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'status', 'SESSION_GUARD_UNAVAILABLE',
                'code', 'SESSION_GUARD_UNAVAILABLE',
                'reason', 'AUTH_TOKEN_MISSING_SESSION_ID',
                'valid', false,
                'allowed', false,
                'error', 'Token JWT não contém claim criptográfica session_id obrigatória.'
            );
        END IF;

        IF p_session_id IS NOT NULL AND p_session_id <> v_jwt_session_id THEN
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                device_fingerprint,
                ip_address,
                metadata,
                created_at
            ) VALUES (
                v_user_id,
                v_jwt_session_id,
                'access_denied_mismatch',
                v_safe_fingerprint,
                NULL,
                jsonb_build_object('outcome', 'SESSION_REVOKED', 'reason', 'session_id_mismatch'),
                v_now
            );

            RETURN jsonb_build_object(
                'status', 'SESSION_REVOKED',
                'code', 'SESSION_ID_MISMATCH',
                'valid', false,
                'allowed', false,
                'error', 'Identificador de sessão informado diverge do token JWT autenticado.'
            );
        END IF;

        v_effective_session_id := v_jwt_session_id;
    ELSE
        IF p_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'status', 'SESSION_GUARD_UNAVAILABLE',
                'code', 'SESSION_GUARD_UNAVAILABLE',
                'reason', 'SESSION_ID_REQUIRED',
                'valid', false,
                'allowed', false,
                'error', 'Identificador de sessão obrigatório.'
            );
        END IF;
        v_effective_session_id := p_session_id;
    END IF;

    -- 2. Per-user atomic transactional lock (serializes concurrent attempts even when table is empty)
    PERFORM pg_advisory_xact_lock(
        hashtext('aeternum_session_guard'),
        hashtext(v_user_id::text)
    );

    -- 3. Verify account status in public.users
    SELECT role, status, COALESCE(license_tier, 'student'), COALESCE(session_guard_enabled, true)
    INTO v_role, v_status, v_license_tier, v_session_guard_enabled
    FROM public.users
    WHERE id = v_user_id;

    IF v_status IS NOT NULL AND NOT (lower(v_status) = ANY(ARRAY['active', 'ativo'])) THEN
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'account_suspended',
            v_safe_fingerprint,
            jsonb_build_object('outcome', 'SESSION_REVOKED', 'reason', 'user_inactive'),
            v_now
        );

        RETURN jsonb_build_object(
            'status', 'SESSION_REVOKED',
            'code', 'SESSION_REVOKED',
            'reason', 'USER_INACTIVE',
            'valid', false,
            'allowed', false,
            'error', 'Conta de usuário inativa ou suspensa.'
        );
    END IF;

    -- 4. Inspect existing session record for this user
    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id
    FOR UPDATE;

    -- CASE 1: No record exists yet -> Grant First Session (SESSION_GRANTED)
    IF NOT FOUND THEN
        INSERT INTO public.user_active_sessions (
            user_id,
            session_id,
            device_fingerprint,
            ip_address,
            status,
            created_at,
            last_active_at,
            last_qualified_activity_at,
            last_presence_check_at,
            inactivity_timeout_minutes,
            last_activity_type,
            last_transfer_at,
            transfer_count_today,
            transfers_reset_date,
            revoked_reason,
            released_at,
            expired_at,
            revoked_at,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            v_safe_fingerprint,
            NULL,
            'active',
            v_now,
            v_now,
            v_now,
            v_now,
            v_inactivity_minutes,
            'initial_login',
            NULL,
            0,
            v_now::date,
            NULL,
            NULL,
            NULL,
            NULL,
            jsonb_build_object('policy', 'FIRST_SESSION_WINS', 'inactivity_minutes', v_inactivity_minutes)
        );

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'session_granted',
            v_safe_fingerprint,
            jsonb_build_object(
                'outcome', 'SESSION_GRANTED',
                'acquisition_type', 'initial_registration',
                'inactivity_minutes', v_inactivity_minutes,
                'license_tier', COALESCE(v_license_tier, 'student')
            ),
            v_now
        );

        RETURN jsonb_build_object(
            'status', 'SESSION_GRANTED',
            'code', 'SESSION_GRANTED',
            'valid', true,
            'allowed', true,
            'active_session_id', v_effective_session_id,
            'inactivity_minutes', v_inactivity_minutes,
            'last_qualified_activity_at', v_now,
            'last_presence_check_at', v_now
        );
    END IF;

    -- CASE 2: Existing record belongs to the SAME session_id
    IF v_record.session_id = v_effective_session_id THEN
        IF v_record.status = 'released' THEN
            RETURN jsonb_build_object(
                'status', 'SESSION_RELEASED',
                'code', 'SESSION_RELEASED',
                'valid', false,
                'allowed', false,
                'released', true,
                'error', 'Sessão encerrada voluntariamente por logout. Faça um novo login.'
            );
        END IF;

        IF v_record.status IN ('revoked', 'displaced') THEN
            RETURN jsonb_build_object(
                'status', 'SESSION_REVOKED',
                'code', 'SESSION_REVOKED',
                'valid', false,
                'allowed', false,
                'revoked', true,
                'error', 'Sessão invalidada ou revogada. Faça um novo login.'
            );
        END IF;

        -- Server-authoritative 60-minute expiration check:
        -- now() >= last_qualified_activity_at + interval '60 minutes'
        IF v_record.status = 'expired'
           OR v_now >= (v_record.last_qualified_activity_at + interval '60 minutes') THEN
            IF v_record.status = 'active' THEN
                UPDATE public.user_active_sessions
                SET status = 'expired',
                    revoked_reason = 'inactivity_timeout',
                    expired_at = v_now
                WHERE user_id = v_user_id;

                INSERT INTO public.session_guard_events (
                    user_id,
                    session_id,
                    event_type,
                    device_fingerprint,
                    metadata,
                    created_at
                ) VALUES (
                    v_user_id,
                    v_effective_session_id,
                    'session_expired_inactivity',
                    v_safe_fingerprint,
                    jsonb_build_object(
                        'outcome', 'SESSION_EXPIRED_INACTIVITY',
                        'inactivity_minutes', v_inactivity_minutes,
                        'last_qualified_activity_at', v_record.last_qualified_activity_at,
                        'expired_at', v_now
                    ),
                    v_now
                );
            END IF;

            RETURN jsonb_build_object(
                'status', 'SESSION_EXPIRED_INACTIVITY',
                'code', 'SESSION_EXPIRED_INACTIVITY',
                'valid', false,
                'allowed', false,
                'expired', true,
                'inactivity_minutes', v_inactivity_minutes,
                'last_qualified_activity_at', v_record.last_qualified_activity_at,
                'error', 'Sessão expirada após 60 minutos de inatividade.'
            );
        END IF;

        -- Same session is still active and within 60 minutes (e.g. multi-tab, reload, JWT sync).
        -- Update ONLY last_presence_check_at; DO NOT reset last_qualified_activity_at!
        UPDATE public.user_active_sessions
        SET last_presence_check_at = v_now
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'session_valid',
            v_safe_fingerprint,
            jsonb_build_object(
                'outcome', 'SESSION_VALID',
                'last_qualified_activity_at', v_record.last_qualified_activity_at,
                'last_presence_check_at', v_now
            ),
            v_now
        );

        RETURN jsonb_build_object(
            'status', 'SESSION_VALID',
            'code', 'SESSION_VALID',
            'valid', true,
            'allowed', true,
            'active_session_id', v_effective_session_id,
            'inactivity_minutes', v_inactivity_minutes,
            'last_qualified_activity_at', v_record.last_qualified_activity_at,
            'last_presence_check_at', v_now
        );
    END IF;

    -- CASE 3: Existing record belongs to a DIFFERENT session_id
    -- Check if the existing session is still active and has NOT reached 60 minutes of inactivity
    IF v_record.status = 'active'
       AND v_now < (v_record.last_qualified_activity_at + interval '60 minutes') THEN
        -- FIRST SESSION WINS: Refuse second session WITHOUT modifying user_active_sessions at all!
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'session_already_active',
            v_safe_fingerprint,
            jsonb_build_object(
                'outcome', 'SESSION_ALREADY_ACTIVE',
                'policy', 'FIRST_SESSION_WINS',
                'transfer_requested', COALESCE(p_confirm_transfer, false),
                'transfer_allowed', false
            ),
            v_now
        );

        RETURN jsonb_build_object(
            'status', 'SESSION_ALREADY_ACTIVE',
            'code', 'SESSION_ALREADY_ACTIVE',
            'valid', false,
            'allowed', false,
            'other_device_active', true,
            'inactivity_minutes', v_inactivity_minutes,
            'error', 'Esta conta já possui uma sessão ativa em outro dispositivo. A primeira sessão permanece preservada.'
        );
    END IF;

    -- CASE 4: Previous session is released, revoked, expired, or has reached >= 60 minutes of inactivity.
    -- Account is free to be acquired by the new valid session!
    IF v_record.status = 'active'
       AND v_now >= (v_record.last_qualified_activity_at + interval '60 minutes') THEN
        -- Record expiration of the prior inactive session before granting the new one
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_record.session_id,
            'session_expired_inactivity',
            v_record.device_fingerprint,
            jsonb_build_object(
                'outcome', 'SESSION_EXPIRED_INACTIVITY',
                'inactivity_minutes', v_inactivity_minutes,
                'last_qualified_activity_at', v_record.last_qualified_activity_at,
                'expired_at', v_now,
                'replaced_by_new_login', true
            ),
            v_now
        );
    END IF;

    UPDATE public.user_active_sessions
    SET session_id = v_effective_session_id,
        device_fingerprint = v_safe_fingerprint,
        ip_address = NULL,
        status = 'active',
        created_at = v_now,
        last_active_at = v_now,
        last_qualified_activity_at = v_now,
        last_presence_check_at = v_now,
        inactivity_timeout_minutes = v_inactivity_minutes,
        last_activity_type = 'initial_login',
        revoked_reason = NULL,
        released_at = NULL,
        expired_at = NULL,
        revoked_at = NULL,
        metadata = jsonb_build_object(
            'policy', 'FIRST_SESSION_WINS',
            'inactivity_minutes', v_inactivity_minutes,
            'acquired_after_previous_status', CASE
                WHEN v_record.status = 'active' THEN 'expired_inactivity'
                ELSE v_record.status
            END
        )
    WHERE user_id = v_user_id;

    INSERT INTO public.session_guard_events (
        user_id,
        session_id,
        event_type,
        device_fingerprint,
        metadata,
        created_at
    ) VALUES (
        v_user_id,
        v_effective_session_id,
        'session_granted',
        v_safe_fingerprint,
        jsonb_build_object(
            'outcome', 'SESSION_GRANTED',
            'acquisition_type', CASE
                WHEN v_record.status = 'active' THEN 'acquired_after_inactivity_timeout'
                ELSE 'acquired_after_' || v_record.status
            END,
            'inactivity_minutes', v_inactivity_minutes,
            'license_tier', COALESCE(v_license_tier, 'student')
        ),
        v_now
    );

    RETURN jsonb_build_object(
        'status', 'SESSION_GRANTED',
        'code', 'SESSION_GRANTED',
        'valid', true,
        'allowed', true,
        'active_session_id', v_effective_session_id,
        'inactivity_minutes', v_inactivity_minutes,
        'last_qualified_activity_at', v_now,
        'last_presence_check_at', v_now
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. SERVER-SIDE SESSION VALIDATION & ACTIVITY CONTROL ROUTINE
--    - Strictly separates last_presence_check_at from last_qualified_activity_at.
--    - Never resets last_qualified_activity_at on heartbeats, JWT refreshes,
--      polling, health checks, or session synchronization.
--    - Enforces server-authoritative expiration:
--      now() >= last_qualified_activity_at + interval '60 minutes'
-- ------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.validate_session_guard(uuid, boolean, text);

CREATE OR REPLACE FUNCTION public.validate_session_guard(
    p_session_id uuid DEFAULT NULL,
    p_touch_activity boolean DEFAULT false,
    p_ip text DEFAULT NULL,
    p_activity_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_now timestamptz := public.session_guard_now();
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_status text;
    v_inactivity_minutes constant integer := 60;
    v_record public.user_active_sessions%ROWTYPE;
    v_is_qualified boolean := false;
    v_normalized_activity text;
    v_effective_qualified_at timestamptz;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_GUARD_UNAVAILABLE',
            'code', 'SESSION_GUARD_UNAVAILABLE',
            'reason', 'AUTH_REQUIRED',
            'error', 'Sessão não autenticada.'
        );
    END IF;

    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;

    IF v_caller_role = 'authenticated' THEN
        IF v_jwt_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'valid', false,
                'status', 'SESSION_GUARD_UNAVAILABLE',
                'code', 'SESSION_GUARD_UNAVAILABLE',
                'reason', 'AUTH_TOKEN_MISSING_SESSION_ID',
                'error', 'Token JWT não contém claim de sessão criptográfica obrigatória.'
            );
        END IF;

        IF p_session_id IS NOT NULL AND p_session_id <> v_jwt_session_id THEN
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                metadata,
                created_at
            ) VALUES (
                v_user_id,
                v_jwt_session_id,
                'access_denied_mismatch',
                jsonb_build_object('outcome', 'SESSION_REVOKED', 'reason', 'session_id_mismatch'),
                v_now
            );

            RETURN jsonb_build_object(
                'valid', false,
                'status', 'SESSION_REVOKED',
                'code', 'SESSION_ID_MISMATCH',
                'error', 'Identificador de sessão fornecido diverge do token JWT autenticado.'
            );
        END IF;

        v_effective_session_id := v_jwt_session_id;
    ELSE
        IF p_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'valid', false,
                'status', 'SESSION_GUARD_UNAVAILABLE',
                'code', 'SESSION_GUARD_UNAVAILABLE',
                'reason', 'SESSION_ID_REQUIRED',
                'error', 'Identificador de sessão obrigatório.'
            );
        END IF;
        v_effective_session_id := p_session_id;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtext('aeternum_session_guard'),
        hashtext(v_user_id::text)
    );

    SELECT status INTO v_status
    FROM public.users
    WHERE id = v_user_id;

    IF v_status IS NOT NULL AND NOT (lower(v_status) = ANY(ARRAY['active', 'ativo'])) THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_REVOKED',
            'code', 'SESSION_REVOKED',
            'reason', 'USER_INACTIVE',
            'error', 'Conta suspensa ou inativa. Acesso negado.'
        );
    END IF;

    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_REVOKED',
            'code', 'NO_ACTIVE_SESSION',
            'error', 'Nenhuma sessão ativa registrada para esta conta.'
        );
    END IF;

    -- Caller session does NOT match the registered session
    IF v_record.session_id <> v_effective_session_id THEN
        -- NEVER modify user_active_sessions when rejecting a non-owner session!
        IF v_record.status = 'active'
           AND v_now < (v_record.last_qualified_activity_at + interval '60 minutes') THEN
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                metadata,
                created_at
            ) VALUES (
                v_user_id,
                v_effective_session_id,
                'session_already_active',
                jsonb_build_object('outcome', 'SESSION_ALREADY_ACTIVE', 'reason', 'validation_by_secondary_session'),
                v_now
            );

            RETURN jsonb_build_object(
                'valid', false,
                'status', 'SESSION_ALREADY_ACTIVE',
                'code', 'SESSION_ALREADY_ACTIVE',
                'other_device_active', true,
                'error', 'Sessão recusada: já existe outra sessão ativa com prioridade nesta conta.'
            );
        ELSE
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                metadata,
                created_at
            ) VALUES (
                v_user_id,
                v_effective_session_id,
                'access_denied_inactive_session',
                jsonb_build_object('outcome', 'SESSION_REVOKED', 'reason', 'stale_or_replaced_jwt'),
                v_now
            );

            RETURN jsonb_build_object(
                'valid', false,
                'status', 'SESSION_REVOKED',
                'code', 'SESSION_REVOKED',
                'revoked', true,
                'error', 'Token JWT pertence a uma sessão anterior já encerrada ou substituída.'
            );
        END IF;
    END IF;

    -- Caller matches the registered session_id: check status
    IF v_record.status = 'released' THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_RELEASED',
            'code', 'SESSION_RELEASED',
            'released', true,
            'error', 'Sessão encerrada voluntariamente. Faça login novamente.'
        );
    END IF;

    IF v_record.status IN ('revoked', 'displaced') THEN
        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_REVOKED',
            'code', 'SESSION_REVOKED',
            'revoked', true,
            'error', 'Sessão revogada. Faça login novamente.'
        );
    END IF;

    -- Check 60-minute server-authoritative inactivity expiration:
    -- now() >= last_qualified_activity_at + interval '60 minutes'
    IF v_record.status = 'expired'
       OR v_now >= (v_record.last_qualified_activity_at + interval '60 minutes') THEN
        IF v_record.status = 'active' THEN
            UPDATE public.user_active_sessions
            SET status = 'expired',
                revoked_reason = 'inactivity_timeout',
                expired_at = v_now
            WHERE user_id = v_user_id;

            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                metadata,
                created_at
            ) VALUES (
                v_user_id,
                v_effective_session_id,
                'session_expired_inactivity',
                jsonb_build_object(
                    'outcome', 'SESSION_EXPIRED_INACTIVITY',
                    'inactivity_minutes', v_inactivity_minutes,
                    'last_qualified_activity_at', v_record.last_qualified_activity_at,
                    'expired_at', v_now
                ),
                v_now
            );
        END IF;

        RETURN jsonb_build_object(
            'valid', false,
            'status', 'SESSION_EXPIRED_INACTIVITY',
            'code', 'SESSION_EXPIRED_INACTIVITY',
            'expired', true,
            'inactivity_minutes', v_inactivity_minutes,
            'last_qualified_activity_at', v_record.last_qualified_activity_at,
            'error', 'Sessão expirada por atingir 60 minutos de inatividade.'
        );
    END IF;

    -- Determine whether this call qualifies to reset the 60-minute inactivity clock
    v_normalized_activity := lower(btrim(COALESCE(p_activity_type, '')));

    IF COALESCE(p_touch_activity, false) IS TRUE THEN
        IF v_normalized_activity = '' THEN
            -- Explicit touch_activity=true without activity subtype (e.g. direct RPC call)
            v_is_qualified := true;
            v_normalized_activity := 'qualified_activity';
        ELSIF public.is_qualified_activity_type(v_normalized_activity) THEN
            v_is_qualified := true;
        ELSE
            -- Non-qualified background signals (heartbeat, jwt_refresh, data_polling,
            -- health_check, session_sync, background_update, login_attempt_refused)
            -- MUST NEVER reset last_qualified_activity_at!
            v_is_qualified := false;
        END IF;
    ELSE
        v_is_qualified := false;
    END IF;

    IF v_is_qualified THEN
        v_effective_qualified_at := v_now;
        UPDATE public.user_active_sessions
        SET last_qualified_activity_at = v_now,
            last_active_at = v_now,
            last_presence_check_at = v_now,
            last_activity_type = v_normalized_activity
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'qualified_activity_recorded',
            jsonb_build_object(
                'outcome', 'SESSION_VALID',
                'activity_type', v_normalized_activity,
                'last_qualified_activity_at', v_now
            ),
            v_now
        );
    ELSE
        v_effective_qualified_at := v_record.last_qualified_activity_at;
        UPDATE public.user_active_sessions
        SET last_presence_check_at = v_now
        WHERE user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'status', 'SESSION_VALID',
        'code', 'SESSION_VALID',
        'session_id', v_effective_session_id,
        'inactivity_minutes', v_inactivity_minutes,
        'qualified_activity_updated', v_is_qualified,
        'last_qualified_activity_at', v_effective_qualified_at,
        'last_presence_check_at', v_now
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. DEDICATED QUALIFIED ACTIVITY RPC
-- Explicitly validates activity category against the 8 approved student study actions
-- and ignores background heartbeats, JWT refreshes, or polling.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.record_qualified_activity(
    p_activity_type text,
    p_session_id uuid DEFAULT NULL,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_is_qualified boolean;
BEGIN
    v_is_qualified := public.is_qualified_activity_type(p_activity_type);

    IF NOT v_is_qualified THEN
        -- Perform only a non-resetting presence check
        RETURN public.validate_session_guard(p_session_id, false, NULL, p_activity_type);
    END IF;

    RETURN public.validate_session_guard(p_session_id, true, NULL, p_activity_type);
END;
$$;


-- ------------------------------------------------------------------------------
-- 8. VOLUNTARY LOGOUT (SESSION_RELEASED) & REVOCATION (SESSION_REVOKED)
--    - Only the active owning session can release the account.
--    - Secondary/rejected sessions attempting to call revoke_active_session are
--      blocked so they cannot forcibly log out the primary session.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.revoke_active_session(
    p_session_id uuid DEFAULT NULL,
    p_reason text DEFAULT 'user_logout'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_now timestamptz := public.session_guard_now();
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_record public.user_active_sessions%ROWTYPE;
    v_is_voluntary boolean;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'status', 'SESSION_GUARD_UNAVAILABLE',
            'code', 'SESSION_GUARD_UNAVAILABLE',
            'error', 'Autenticação necessária.'
        );
    END IF;

    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;

    IF v_caller_role = 'authenticated' THEN
        IF v_jwt_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 'SESSION_GUARD_UNAVAILABLE',
                'code', 'SESSION_GUARD_UNAVAILABLE',
                'error', 'Token JWT sem session_id.'
            );
        END IF;
        IF p_session_id IS NOT NULL AND p_session_id <> v_jwt_session_id THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 'SESSION_REVOKED',
                'code', 'SESSION_ID_MISMATCH',
                'error', 'Identificador de sessão diverge do token JWT.'
            );
        END IF;
        v_effective_session_id := v_jwt_session_id;
    ELSE
        v_effective_session_id := p_session_id;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtext('aeternum_session_guard'),
        hashtext(v_user_id::text)
    );

    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'released', false,
            'revoked', false,
            'status', 'SESSION_RELEASED',
            'code', 'SESSION_RELEASED',
            'message', 'Nenhuma sessão ativa encontrada.'
        );
    END IF;

    -- Prevent a non-owner session from releasing or revoking the primary active session!
    IF v_effective_session_id IS NOT NULL AND v_record.session_id <> v_effective_session_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'released', false,
            'revoked', false,
            'status', 'SESSION_ALREADY_ACTIVE',
            'code', 'SESSION_ALREADY_ACTIVE',
            'error', 'Operação negada: apenas a sessão titular pode encerrar sua própria sessão.'
        );
    END IF;

    v_is_voluntary := lower(btrim(COALESCE(p_reason, 'user_logout'))) = ANY (
        ARRAY['user_logout', 'voluntary_release', 'session_released', 'logout']
    );

    IF v_is_voluntary THEN
        UPDATE public.user_active_sessions
        SET status = 'released',
            revoked_reason = COALESCE(p_reason, 'user_logout'),
            released_at = v_now
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_record.session_id,
            'session_released',
            jsonb_build_object('outcome', 'SESSION_RELEASED', 'reason', COALESCE(p_reason, 'user_logout')),
            v_now
        );

        RETURN jsonb_build_object(
            'success', true,
            'released', true,
            'revoked', true,
            'status', 'SESSION_RELEASED',
            'code', 'SESSION_RELEASED'
        );
    ELSE
        UPDATE public.user_active_sessions
        SET status = 'revoked',
            revoked_reason = COALESCE(p_reason, 'session_revoked'),
            revoked_at = v_now
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            v_record.session_id,
            'session_revoked',
            jsonb_build_object('outcome', 'SESSION_REVOKED', 'reason', COALESCE(p_reason, 'session_revoked')),
            v_now
        );

        RETURN jsonb_build_object(
            'success', true,
            'released', false,
            'revoked', true,
            'status', 'SESSION_REVOKED',
            'code', 'SESSION_REVOKED'
        );
    END IF;
END;
$$;


-- ------------------------------------------------------------------------------
-- 9. ADMINISTRATIVE OVERRIDE / RESET ROUTINE (SESSION_REVOKED)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_reset_user_session(
    p_target_user_id uuid,
    p_reason text DEFAULT 'admin_override'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_now timestamptz := public.session_guard_now();
    v_caller_id uuid;
    v_caller_role text;
    v_target_record public.user_active_sessions%ROWTYPE;
BEGIN
    v_caller_id := auth.uid();
    v_caller_role := auth.role();

    IF v_caller_role <> 'service_role' THEN
        IF v_caller_id IS NULL OR NOT public.is_current_jwt_session_active() THEN
            RAISE EXCEPTION 'UNAUTHORIZED: Active authenticated administrative session required';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.users
            WHERE id = v_caller_id
              AND role IN ('super_admin', 'rector', 'admin')
              AND lower(status) IN ('active', 'ativo')
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: Insufficient administrative privileges';
        END IF;
    END IF;

    PERFORM pg_advisory_xact_lock(
        hashtext('aeternum_session_guard'),
        hashtext(p_target_user_id::text)
    );

    SELECT * INTO v_target_record
    FROM public.user_active_sessions
    WHERE user_id = p_target_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'reset', false,
            'status', 'SESSION_REVOKED',
            'code', 'SESSION_REVOKED',
            'message', 'Nenhuma sessão registrada para o usuário informado.'
        );
    END IF;

    UPDATE public.user_active_sessions
    SET status = 'revoked',
        revoked_reason = COALESCE(p_reason, 'admin_override'),
        revoked_at = v_now,
        transfer_count_today = 0
    WHERE user_id = p_target_user_id;

    INSERT INTO public.session_guard_events (
        user_id,
        session_id,
        event_type,
        metadata,
        created_at
    ) VALUES (
        p_target_user_id,
        v_target_record.session_id,
        'admin_reset',
        jsonb_build_object(
            'outcome', 'SESSION_REVOKED',
            'reset_by_caller_id', v_caller_id,
            'caller_role', v_caller_role,
            'reason', COALESCE(p_reason, 'admin_override')
        ),
        v_now
    );

    RETURN jsonb_build_object(
        'success', true,
        'reset', true,
        'status', 'SESSION_REVOKED',
        'code', 'SESSION_REVOKED',
        'target_user_id', p_target_user_id
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 10. TIERED & LEGACY AI/VOICE/RETRIEVAL RPCs HARDENED WITH SESSION GUARD
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit_tiered(
    p_session_id uuid DEFAULT NULL,
    p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_now timestamptz := public.session_guard_now();
    v_user_id uuid;
    v_role text;
    v_license_tier text;
    v_validation jsonb;
    v_max_requests integer := 4;
    v_window_seconds integer := 300;
    v_rate_row public.ai_rate_limits%ROWTYPE;
    v_retry_after integer := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', 'SESSION_GUARD_UNAVAILABLE',
            'code', 'SESSION_GUARD_UNAVAILABLE',
            'error', 'Autenticação necessária.'
        );
    END IF;

    -- 1. Validate Session Guard & record qualified activity ('ai_tutor_query')
    v_validation := public.validate_session_guard(p_session_id, true, NULL, 'ai_tutor_query');
    IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'status', v_validation->>'status',
            'code', v_validation->>'code',
            'error', v_validation->>'error',
            'other_device_active', COALESCE((v_validation->>'other_device_active')::boolean, false),
            'expired', COALESCE((v_validation->>'expired')::boolean, false),
            'released', COALESCE((v_validation->>'released')::boolean, false),
            'revoked', COALESCE((v_validation->>'revoked')::boolean, false)
        );
    END IF;

    -- 2. Resolve server-controlled tier limits
    SELECT role, COALESCE(license_tier, 'student')
    INTO v_role, v_license_tier
    FROM public.users
    WHERE id = v_user_id;

    IF v_license_tier = 'demo' OR v_role = 'demo' THEN
        v_max_requests := 2;
        v_window_seconds := 60;
    ELSIF v_role = 'student' THEN
        v_max_requests := 4;
        v_window_seconds := 300;
    ELSE
        v_max_requests := 30;
        v_window_seconds := 60;
    END IF;

    -- 3. Consume rate limit window
    INSERT INTO public.ai_rate_limits (user_id, window_started_at, request_count, updated_at)
    VALUES (v_user_id, v_now, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE
    SET window_started_at = CASE
            WHEN public.ai_rate_limits.window_started_at <= v_now - (v_window_seconds || ' seconds')::interval THEN v_now
            ELSE public.ai_rate_limits.window_started_at
        END,
        request_count = CASE
            WHEN public.ai_rate_limits.window_started_at <= v_now - (v_window_seconds || ' seconds')::interval THEN 1
            ELSE public.ai_rate_limits.request_count + 1
        END,
        updated_at = v_now
    RETURNING * INTO v_rate_row;

    IF v_rate_row.request_count > v_max_requests THEN
        v_retry_after := GREATEST(1, v_window_seconds - FLOOR(EXTRACT(EPOCH FROM (v_now - v_rate_row.window_started_at)))::integer);

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            metadata,
            created_at
        ) VALUES (
            v_user_id,
            (v_validation->>'session_id')::uuid,
            'rate_limit_exceeded',
            jsonb_build_object(
                'max_requests', v_max_requests,
                'window_seconds', v_window_seconds,
                'request_count', v_rate_row.request_count,
                'retry_after_seconds', v_retry_after,
                'license_tier', v_license_tier
            ),
            v_now
        );

        RETURN jsonb_build_object(
            'allowed', false,
            'status', 'SESSION_VALID',
            'code', 'AI_RATE_LIMITED',
            'error', 'Limite de consultas à IA atingido para este período. Aguarde um instante.',
            'retry_after_seconds', v_retry_after,
            'max_requests', v_max_requests,
            'window_seconds', v_window_seconds
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'status', 'SESSION_VALID',
        'code', 'SESSION_VALID',
        'remaining_in_window', GREATEST(0, v_max_requests - v_rate_row.request_count),
        'max_requests', v_max_requests,
        'window_seconds', v_window_seconds
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(
    max_requests integer DEFAULT 20,
    window_seconds integer DEFAULT 60
)
RETURNS TABLE(allowed boolean, remaining integer, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    caller uuid := auth.uid();
    v_now timestamptz := public.session_guard_now();
    limit_row public.ai_rate_limits%ROWTYPE;
    safe_max integer := LEAST(GREATEST(max_requests, 1), 120);
    safe_window integer := LEAST(GREATEST(window_seconds, 10), 3600);
BEGIN
    IF caller IS NULL THEN
        RAISE EXCEPTION 'Autenticação obrigatória.' USING ERRCODE = '42501';
    END IF;

    IF auth.role() <> 'service_role' AND NOT public.is_current_jwt_session_active() THEN
        RAISE EXCEPTION 'SESSION_NOT_AUTHORIZED: Sessão não autorizada, substituída ou expirada por inatividade.' USING ERRCODE = '42501';
    END IF;

    -- Touch qualified activity for the active session
    UPDATE public.user_active_sessions
    SET last_qualified_activity_at = v_now,
        last_active_at = v_now,
        last_presence_check_at = v_now,
        last_activity_type = 'ai_tutor_query'
    WHERE user_id = caller
      AND status = 'active';

    INSERT INTO public.ai_rate_limits (user_id, window_started_at, request_count, updated_at)
    VALUES (caller, v_now, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE
    SET window_started_at = CASE
            WHEN public.ai_rate_limits.window_started_at <= v_now - make_interval(secs => safe_window)
                THEN v_now
            ELSE public.ai_rate_limits.window_started_at
        END,
        request_count = CASE
            WHEN public.ai_rate_limits.window_started_at <= v_now - make_interval(secs => safe_window)
                THEN 1
            ELSE public.ai_rate_limits.request_count + 1
        END,
        updated_at = v_now
    RETURNING * INTO limit_row;

    allowed := limit_row.request_count <= safe_max;
    remaining := GREATEST(safe_max - limit_row.request_count, 0);
    retry_after_seconds := CASE
        WHEN allowed THEN 0
        ELSE GREATEST(
            1,
            safe_window - FLOOR(EXTRACT(EPOCH FROM (v_now - limit_row.window_started_at)))::integer
        )
    END;
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_voice_rate_limit()
RETURNS TABLE(allowed boolean, retry_after_seconds integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_window_started_at timestamptz;
    v_request_count integer;
    v_now timestamptz := public.session_guard_now();
    v_limit constant integer := 8;
    v_window_seconds constant integer := 60;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;

    IF auth.role() <> 'service_role' AND NOT public.is_current_jwt_session_active() THEN
        RAISE EXCEPTION 'SESSION_NOT_AUTHORIZED: Sessão não autorizada ou inativa.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.user_active_sessions
    SET last_qualified_activity_at = v_now,
        last_active_at = v_now,
        last_presence_check_at = v_now,
        last_activity_type = 'form_tool_interaction'
    WHERE user_id = v_user_id
      AND status = 'active';

    INSERT INTO public.vita_voice_rate_limits AS limits (
        user_id,
        window_started_at,
        request_count,
        updated_at
    )
    VALUES (v_user_id, v_now, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE
    SET window_started_at = CASE
            WHEN limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
                THEN v_now
            ELSE limits.window_started_at
        END,
        request_count = CASE
            WHEN limits.window_started_at <= v_now - make_interval(secs => v_window_seconds)
                THEN 1
            ELSE limits.request_count + 1
        END,
        updated_at = v_now
    RETURNING limits.window_started_at, limits.request_count
        INTO v_window_started_at, v_request_count;

    RETURN QUERY SELECT
        v_request_count <= v_limit,
        CASE
            WHEN v_request_count <= v_limit THEN 0
            ELSE GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
                v_window_started_at + make_interval(secs => v_window_seconds) - v_now
            )))::integer)
        END;
END;
$$;

CREATE OR REPLACE FUNCTION public.match_vita_sovereign_knowledge(
    search_query text,
    target_entities text[] DEFAULT '{}'::text[],
    target_domain text DEFAULT NULL::text,
    match_count integer DEFAULT 4
)
RETURNS TABLE(
    id uuid,
    book_title text,
    source_file text,
    source_sha256 text,
    page_number integer,
    chunk_index integer,
    content text,
    metadata jsonb,
    lexical_rank double precision,
    retrieval_stage integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_limit integer := LEAST(GREATEST(match_count, 1), 12);
    v_clean_query text := NULLIF(btrim(search_query), '');
BEGIN
    IF auth.role() <> 'service_role' AND NOT public.is_current_jwt_session_active() THEN
        RAISE EXCEPTION 'SESSION_NOT_AUTHORIZED: Sessão não autorizada ou expirada.' USING ERRCODE = '42501';
    END IF;

    IF target_entities IS NOT NULL AND cardinality(target_entities) > 0 THEN
        RETURN QUERY
        SELECT
            k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
            k.content, k.metadata, 0.95::double precision AS lexical_rank, 1 AS retrieval_stage
        FROM public.vita_anatomical_knowledge k
        WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
          AND (
            EXISTS (
              SELECT 1 FROM jsonb_array_elements_text(COALESCE(k.metadata->'structures', '[]'::jsonb)) s
              WHERE s = ANY(target_entities)
            )
            OR (k.metadata->>'topic') = ANY(target_entities)
          )
        ORDER BY k.page_number
        LIMIT v_limit;

        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    IF v_clean_query IS NOT NULL THEN
        RETURN QUERY
        WITH ranked AS (
            SELECT
                k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
                k.content, k.metadata,
                ts_rank_cd(
                    to_tsvector('public.pt_unaccent', coalesce(k.book_title, '') || ' ' || coalesce(k.content, '')),
                    websearch_to_tsquery('public.pt_unaccent', v_clean_query),
                    32
                )::double precision AS lexical_rank,
                2 AS retrieval_stage
            FROM public.vita_anatomical_knowledge k
            WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
        )
        SELECT r.id, r.book_title, r.source_file, r.source_sha256, r.page_number, r.chunk_index,
               r.content, r.metadata, r.lexical_rank, r.retrieval_stage
        FROM ranked r
        WHERE r.lexical_rank > 0.05
        ORDER BY r.lexical_rank DESC, r.page_number
        LIMIT v_limit;

        IF FOUND THEN
            RETURN;
        END IF;

        RETURN QUERY
        WITH relaxed AS (
            SELECT
                k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
                k.content, k.metadata,
                ts_rank_cd(
                    to_tsvector('public.pt_unaccent', coalesce(k.book_title, '') || ' ' || coalesce(k.content, '')),
                    plainto_tsquery('public.pt_unaccent', v_clean_query),
                    32
                )::double precision AS lexical_rank,
                3 AS retrieval_stage
            FROM public.vita_anatomical_knowledge k
            WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
        )
        SELECT r.id, r.book_title, r.source_file, r.source_sha256, r.page_number, r.chunk_index,
               r.content, r.metadata, r.lexical_rank, r.retrieval_stage
        FROM relaxed r
        WHERE r.lexical_rank > 0.01
        ORDER BY r.lexical_rank DESC, r.page_number
        LIMIT v_limit;

        IF FOUND THEN
            RETURN;
        END IF;
    END IF;

    IF target_domain IS NOT NULL THEN
        RETURN QUERY
        SELECT
            k.id, k.book_title, k.source_file, k.source_sha256, k.page_number, k.chunk_index,
            k.content, k.metadata, 0.25::double precision AS lexical_rank, 4 AS retrieval_stage
        FROM public.vita_anatomical_knowledge k
        WHERE (k.metadata->>'qa_only' IS DISTINCT FROM 'true')
          AND (k.metadata->>'domain') = target_domain
        ORDER BY k.page_number
        LIMIT v_limit;
    END IF;
END;
$$;


-- ------------------------------------------------------------------------------
-- 11. AUTOMATIC QUALIFIED ACTIVITY TRIGGERS ON ACADEMIC TABLES
-- Server-verified academic mutations automatically refresh last_qualified_activity_at.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.touch_session_on_academic_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id uuid := auth.uid();
    v_jwt_session_id uuid := NULLIF(auth.jwt() ->> 'session_id', '')::uuid;
    v_now timestamptz := public.session_guard_now();
    v_activity_type text := COALESCE(TG_ARGV[0], 'educational_progress');
BEGIN
    IF v_user_id IS NOT NULL AND v_jwt_session_id IS NOT NULL THEN
        UPDATE public.user_active_sessions
        SET last_qualified_activity_at = v_now,
            last_active_at = v_now,
            last_presence_check_at = v_now,
            last_activity_type = v_activity_type
        WHERE user_id = v_user_id
          AND session_id = v_jwt_session_id
          AND status = 'active'
          AND v_now < (last_qualified_activity_at + interval '60 minutes')
          AND last_qualified_activity_at IS DISTINCT FROM v_now;
    END IF;
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.touch_session_on_academic_write() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.touch_session_on_academic_write() TO service_role;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM (VALUES
        ('ai_conversations', 'ai_tutor_query'),
        ('ai_messages', 'ai_tutor_query'),
        ('anatomical_quiz_attempts', 'quiz_answer_submission'),
        ('anatomical_quiz_answers', 'quiz_answer_submission'),
        ('viewer_quiz_results', 'quiz_answer_submission'),
        ('study_agenda_events', 'agenda_edit'),
        ('viewer_learning_sessions', 'educational_progress'),
        ('viewer_learning_events', 'educational_progress')
    ) AS t(tbl, act)
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = r.tbl
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_session_guard_qualified_activity ON public.%I;', r.tbl);
            EXECUTE format(
                'CREATE TRIGGER trg_session_guard_qualified_activity AFTER INSERT OR UPDATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.touch_session_on_academic_write(%L);',
                r.tbl,
                r.act
            );
        END IF;
    END LOOP;
END;
$$;


-- ------------------------------------------------------------------------------
-- 12. SERVER-SIDE RLS HARDENING (FASE 6)
--     - Scopes user_active_sessions and session_guard_events SELECT to the
--       exact JWT session_id so secondary sessions cannot read primary session metadata.
--     - Adds AS RESTRICTIVE policies on academic tables so a secondary or expired
--       JWT with the same auth.uid() is blocked at the database layer.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS user_active_sessions_select_own ON public.user_active_sessions;
CREATE POLICY user_active_sessions_select_own
    ON public.user_active_sessions
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        AND session_id = NULLIF(auth.jwt() ->> 'session_id', '')::uuid
    );

DROP POLICY IF EXISTS session_guard_events_select_own ON public.session_guard_events;
CREATE POLICY session_guard_events_select_own
    ON public.session_guard_events
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        AND session_id = NULLIF(auth.jwt() ->> 'session_id', '')::uuid
    );

DROP POLICY IF EXISTS ai_rate_limits_select_own ON public.ai_rate_limits;
CREATE POLICY ai_rate_limits_select_own
    ON public.ai_rate_limits
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        AND public.is_current_jwt_session_active()
    );

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
            EXECUTE format(
                'CREATE POLICY session_guard_enforce_active_jwt_session ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (public.is_current_jwt_session_active()) WITH CHECK (public.is_current_jwt_session_active());',
                v_tbl
            );
        END IF;
    END LOOP;
END;
$$;


-- ------------------------------------------------------------------------------
-- 13. LEAST-PRIVILEGE GRANTS & REVOCATIONS
-- ------------------------------------------------------------------------------

REVOKE ALL ON TABLE public.user_active_sessions FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.session_guard_events FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.ai_rate_limits FROM PUBLIC, anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.user_active_sessions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.session_guard_events FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.ai_rate_limits FROM authenticated;

GRANT SELECT ON TABLE public.user_active_sessions TO authenticated;
GRANT SELECT ON TABLE public.session_guard_events TO authenticated;
GRANT SELECT ON TABLE public.ai_rate_limits TO authenticated;

GRANT ALL ON TABLE public.user_active_sessions TO service_role;
GRANT ALL ON TABLE public.session_guard_events TO service_role;
GRANT ALL ON TABLE public.ai_rate_limits TO service_role;

REVOKE ALL ON FUNCTION public.register_or_transfer_session(uuid, text, text, boolean, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.validate_session_guard(uuid, boolean, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_qualified_activity(text, uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_rate_limit_tiered(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_voice_rate_limit() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.match_vita_sovereign_knowledge(text, text[], text, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_active_session(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_user_session(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.register_or_transfer_session(uuid, text, text, boolean, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_session_guard(uuid, boolean, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_qualified_activity(text, uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit_tiered(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_voice_rate_limit() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_vita_sovereign_knowledge(text, text[], text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_active_session(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_session(uuid, text) TO authenticated, service_role;

COMMIT;
