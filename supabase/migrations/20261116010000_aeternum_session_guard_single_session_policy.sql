-- ==============================================================================
-- AETERNUM ATLAS — P0 SESSION GUARD MIGRATION (AUDITADO & HARDENED P0.3)
-- Migration: 20261116010000_aeternum_session_guard_single_session_policy.sql
-- Description: Implement single active session per user policy, cryptographic
--              session binding to JWT claims, server-controlled license tiers,
--              atomic session transfers with confirmation option, inactivity timeouts,
--              audit logging without leaking third-party session IDs, account status
--              checks, and tiered AI rate limits matching canonical schema.
-- Pre-conditions: PostgreSQL 15+, public schema initialized, auth.users present.
-- Rollback Plan: supabase/rollback-plans/rollback_20261116010000_aeternum_session_guard_single_session_policy.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CANONICAL SESSION REGISTRY TABLE
-- Primary key on user_id strictly guarantees at most ONE active session per account.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_active_sessions (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    device_fingerprint text,
    ip_address text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'displaced', 'expired', 'revoked')),
    created_at timestamptz NOT NULL DEFAULT now(),
    last_active_at timestamptz NOT NULL DEFAULT now(),
    last_transfer_at timestamptz,
    transfer_count_today integer NOT NULL DEFAULT 0,
    transfers_reset_date date NOT NULL DEFAULT current_date,
    revoked_reason text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_active_sessions_session_id 
    ON public.user_active_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_user_active_sessions_last_active 
    ON public.user_active_sessions(last_active_at);

-- ------------------------------------------------------------------------------
-- 2. AUDIT TRAIL: SESSION GUARD EVENTS
-- Immutable audit log for authorization decisions, device transfers and risk analysis.
-- ZERO passwords, JWTs or refresh tokens stored.
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.session_guard_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id uuid NOT NULL,
    event_type text NOT NULL CHECK (event_type IN (
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
        'session_revoked',
        'admin_reset'
    )),
    device_fingerprint text,
    ip_address text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_guard_events_user_created 
    ON public.session_guard_events(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. CANONICAL AI RATE LIMITS TABLE
-- Matches canonical schema from 20260921000000_restore_canonical_consume_ai_rate_limit.sql
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    window_started_at timestamptz NOT NULL DEFAULT now(),
    request_count integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3.1. USER ATTRIBUTES: LICENSE TIER & FEATURE FLAG (SERVER-CONTROLLED P0.3)
-- Decouples subscription / license entitlement from fragile identifiers like email.
-- Allows controlled progressive rollout starting strictly with the demo account.
-- ------------------------------------------------------------------------------

ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS license_tier text DEFAULT 'student',
    ADD COLUMN IF NOT EXISTS session_guard_enabled boolean DEFAULT false;

-- Initialize demo accounts with protected tier and enabled session guard
UPDATE public.users 
SET license_tier = 'demo', 
    session_guard_enabled = true 
WHERE id = '5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f'
   OR email = 'demo.institucional@aeternumatlas.com';

-- ------------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- Principle of least privilege: authenticated users can only READ their own record.
-- Direct table mutations (INSERT, UPDATE, DELETE) are strictly revoked.
-- ------------------------------------------------------------------------------

ALTER TABLE public.user_active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_guard_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS user_active_sessions_select_own ON public.user_active_sessions;
DROP POLICY IF EXISTS session_guard_events_select_own ON public.session_guard_events;
DROP POLICY IF EXISTS ai_rate_limits_select_own ON public.ai_rate_limits;

CREATE POLICY user_active_sessions_select_own 
    ON public.user_active_sessions 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY session_guard_events_select_own 
    ON public.session_guard_events 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY ai_rate_limits_select_own 
    ON public.ai_rate_limits 
    FOR SELECT 
    TO authenticated 
    USING (user_id = auth.uid());

-- Revoke direct table mutations from public, anon and authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_active_sessions FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.session_guard_events FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_rate_limits FROM PUBLIC, anon, authenticated;

-- Grant SELECT to authenticated and full access to service_role
GRANT SELECT ON public.user_active_sessions TO authenticated;
GRANT SELECT ON public.session_guard_events TO authenticated;
GRANT SELECT ON public.ai_rate_limits TO authenticated;

GRANT ALL ON public.user_active_sessions TO service_role;
GRANT ALL ON public.session_guard_events TO service_role;
GRANT ALL ON public.ai_rate_limits TO service_role;


-- ------------------------------------------------------------------------------
-- 5. ATOMIC SESSION REGISTRATION & TRANSFER ROUTINE (CRYPTOGRAPHICALLY BOUND)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.register_or_transfer_session(
    p_session_id uuid,
    p_device_fingerprint text DEFAULT NULL,
    p_ip text DEFAULT NULL,
    p_confirm_transfer boolean DEFAULT true,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_role text;
    v_status text;
    v_license_tier text;
    v_session_guard_enabled boolean;
    v_max_transfers integer := 5;
    v_inactivity_minutes integer := 60;
    v_record public.user_active_sessions%ROWTYPE;
    v_transfers_today integer := 0;
    v_displaced_session_id uuid;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED: Authenticated session required';
    END IF;

    -- Cryptographic session validation from JWT claims (P0.3)
    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;

    IF v_caller_role = 'authenticated' THEN
        IF v_jwt_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'status', 'forbidden',
                'code', 'AUTH_TOKEN_MISSING_SESSION_ID',
                'error', 'Token JWT não contém claim de sessão criptográfica obrigatória.'
            );
        END IF;

        IF p_session_id IS NOT NULL AND p_session_id <> v_jwt_session_id THEN
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                device_fingerprint,
                ip_address,
                metadata
            ) VALUES (
                v_user_id,
                v_jwt_session_id,
                'access_denied_mismatch',
                p_device_fingerprint,
                p_ip,
                jsonb_build_object('reason', 'client_passed_arbitrary_session_id', 'client_session_id', p_session_id)
            );

            RETURN jsonb_build_object(
                'status', 'forbidden',
                'code', 'SESSION_ID_MISMATCH',
                'error', 'Identificador de sessão fornecido diverge da assinatura criptográfica do token.'
            );
        END IF;

        v_effective_session_id := v_jwt_session_id;
    ELSE
        -- Service role or administrative caller
        IF p_session_id IS NULL THEN
            RAISE EXCEPTION 'SESSION_ID_REQUIRED: Session identifier required';
        END IF;
        v_effective_session_id := p_session_id;
    END IF;

    -- Resolve user tier parameters and account status (Decoupled from email, based on license_tier/role)
    SELECT role, status, COALESCE(license_tier, 'student'), COALESCE(session_guard_enabled, false)
    INTO v_role, v_status, v_license_tier, v_session_guard_enabled
    FROM public.users
    WHERE id = v_user_id;

    -- Fail closed on inactive or suspended account
    IF v_status IS NOT NULL AND NOT (v_status = ANY(ARRAY['active', 'ativo'])) THEN
        RETURN jsonb_build_object(
            'status', 'account_inactive',
            'error', 'Conta de usuário inativa ou suspensa. Contate a administração.',
            'code', 'USER_INACTIVE'
        );
    END IF;

    IF v_license_tier = 'demo' OR v_role = 'demo' THEN
        v_max_transfers := 3;
        v_inactivity_minutes := 30;
    ELSIF v_role = 'student' THEN
        v_max_transfers := 5;
        v_inactivity_minutes := 60;
    ELSE
        -- Teachers, Admins, Institutional Coordinators
        v_max_transfers := 10;
        v_inactivity_minutes := 120;
    END IF;

    -- Concurrency serialization via SELECT ... FOR UPDATE
    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id
    FOR UPDATE;

    -- Case 1: First time registration for this user
    IF NOT FOUND THEN
        INSERT INTO public.user_active_sessions (
            user_id,
            session_id,
            device_fingerprint,
            ip_address,
            status,
            created_at,
            last_active_at,
            last_transfer_at,
            transfer_count_today,
            transfers_reset_date,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            p_device_fingerprint,
            p_ip,
            'active',
            now(),
            now(),
            now(),
            0,
            current_date,
            p_metadata
        );

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'session_registered',
            p_device_fingerprint,
            p_ip,
            jsonb_build_object('max_transfers', v_max_transfers, 'inactivity_minutes', v_inactivity_minutes, 'license_tier', v_license_tier)
        );

        RETURN jsonb_build_object(
            'status', 'registered',
            'active_session_id', v_effective_session_id,
            'transfers_today', 0,
            'max_transfers', v_max_transfers,
            'inactivity_minutes', v_inactivity_minutes
        );
    END IF;

    -- Compute daily reset of transfer counters
    IF v_record.transfers_reset_date < current_date THEN
        v_transfers_today := 0;
    ELSE
        v_transfers_today := v_record.transfer_count_today;
    END IF;

    -- Case 2: Same session confirmed (page reload, multi-tab, network switch)
    IF v_record.session_id = v_effective_session_id THEN
        -- A revoked session CANNOT be re-activated (P0.3)
        IF v_record.status = 'revoked' THEN
            RETURN jsonb_build_object(
                'status', 'revoked',
                'code', 'SESSION_REVOKED',
                'error', 'Sessão revogada previamente. É necessário realizar um novo login.'
            );
        END IF;

        -- Check if existing session was marked expired
        IF v_record.status = 'active' AND (now() - v_record.last_active_at) > (v_inactivity_minutes || ' minutes')::interval THEN
            UPDATE public.user_active_sessions
            SET status = 'expired',
                revoked_reason = 'inactivity_timeout'
            WHERE user_id = v_user_id;

            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                device_fingerprint,
                ip_address,
                metadata
            ) VALUES (
                v_user_id,
                v_effective_session_id,
                'inactivity_expired',
                p_device_fingerprint,
                p_ip,
                jsonb_build_object('inactivity_minutes', v_inactivity_minutes)
            );

            RETURN jsonb_build_object(
                'status', 'expired',
                'reason', 'inactivity_timeout',
                'inactivity_minutes', v_inactivity_minutes
            );
        END IF;

        -- Normal session confirmation (smooth continuation)
        UPDATE public.user_active_sessions
        SET last_active_at = now(),
            ip_address = COALESCE(p_ip, ip_address),
            device_fingerprint = COALESCE(p_device_fingerprint, device_fingerprint),
            transfers_reset_date = current_date,
            transfer_count_today = v_transfers_today,
            status = 'active',
            revoked_reason = NULL
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'session_confirmed',
            p_device_fingerprint,
            p_ip,
            jsonb_build_object('transfers_today', v_transfers_today)
        );

        RETURN jsonb_build_object(
            'status', 'confirmed',
            'active_session_id', v_effective_session_id,
            'transfers_today', v_transfers_today,
            'max_transfers', v_max_transfers,
            'inactivity_minutes', v_inactivity_minutes
        );
    END IF;

    -- Case 3: Different session (new device login requesting transfer)
    IF v_transfers_today >= v_max_transfers THEN
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'transfer_limit_exceeded',
            p_device_fingerprint,
            p_ip,
            jsonb_build_object(
                'max_transfers', v_max_transfers,
                'transfers_today', v_transfers_today
            )
        );

        -- DO NOT leak the active session ID of the other device (P0.3)
        RETURN jsonb_build_object(
            'status', 'transfer_limit_exceeded',
            'error', 'Limite diário de transferências de dispositivo atingido.',
            'max_transfers', v_max_transfers,
            'transfers_today', v_transfers_today,
            'other_device_active', true
        );
    END IF;

    -- Check if caller requested confirmation before executing transfer
    IF p_confirm_transfer IS NOT TRUE THEN
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            device_fingerprint,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'transfer_confirmation_required',
            p_device_fingerprint,
            p_ip,
            jsonb_build_object(
                'transfers_remaining', v_max_transfers - v_transfers_today
            )
        );

        -- DO NOT leak the active session ID of the other device (P0.3)
        RETURN jsonb_build_object(
            'status', 'transfer_confirmation_required',
            'other_device_active', true,
            'other_device_fingerprint', COALESCE(v_record.device_fingerprint, 'dispositivo_conectado'),
            'last_active_at', v_record.last_active_at,
            'transfers_today', v_transfers_today,
            'max_transfers', v_max_transfers,
            'transfers_remaining', v_max_transfers - v_transfers_today
        );
    END IF;

    -- Execute transfer: old session displaced, new session becomes active
    v_displaced_session_id := v_record.session_id;

    UPDATE public.user_active_sessions
    SET session_id = v_effective_session_id,
        device_fingerprint = p_device_fingerprint,
        ip_address = p_ip,
        status = 'active',
        created_at = now(),
        last_active_at = now(),
        last_transfer_at = now(),
        transfer_count_today = v_transfers_today + 1,
        transfers_reset_date = current_date,
        revoked_reason = NULL,
        metadata = p_metadata
    WHERE user_id = v_user_id;

    -- Log displacement of old session (in private audit table only)
    INSERT INTO public.session_guard_events (
        user_id,
        session_id,
        event_type,
        device_fingerprint,
        ip_address,
        metadata
    ) VALUES (
        v_user_id,
        v_displaced_session_id,
        'session_displaced',
        v_record.device_fingerprint,
        v_record.ip_address,
        jsonb_build_object(
            'transfers_today', v_transfers_today + 1
        )
    );

    -- Log activation of new session
    INSERT INTO public.session_guard_events (
        user_id,
        session_id,
        event_type,
        device_fingerprint,
        ip_address,
        metadata
    ) VALUES (
        v_user_id,
        v_effective_session_id,
        'session_transferred',
        p_device_fingerprint,
        p_ip,
        jsonb_build_object(
            'transfers_today', v_transfers_today + 1,
            'transfers_remaining', v_max_transfers - (v_transfers_today + 1)
        )
    );

    -- Return transfer confirmation WITHOUT disclosing displaced session ID (P0.3)
    RETURN jsonb_build_object(
        'status', 'transferred',
        'transferred', true,
        'active_session_id', v_effective_session_id,
        'transfers_today', v_transfers_today + 1,
        'max_transfers', v_max_transfers,
        'transfers_remaining', v_max_transfers - (v_transfers_today + 1),
        'inactivity_minutes', v_inactivity_minutes
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 6. VALIDATION ROUTINE FOR SERVER-SIDE GATES (CRYPTOGRAPHICALLY BOUND)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_session_guard(
    p_session_id uuid,
    p_touch_activity boolean DEFAULT true,
    p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_role text;
    v_status text;
    v_license_tier text;
    v_inactivity_minutes integer := 60;
    v_record public.user_active_sessions%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'code', 'AUTH_REQUIRED', 'error', 'Sessão não autenticada.');
    END IF;

    -- Cryptographic session validation from JWT claims (P0.3)
    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;

    IF v_caller_role = 'authenticated' THEN
        IF v_jwt_session_id IS NULL THEN
            RETURN jsonb_build_object(
                'valid', false,
                'code', 'AUTH_TOKEN_MISSING_SESSION_ID',
                'error', 'Token JWT não contém claim de sessão criptográfica obrigatória.'
            );
        END IF;

        IF p_session_id IS NOT NULL AND p_session_id <> v_jwt_session_id THEN
            INSERT INTO public.session_guard_events (
                user_id,
                session_id,
                event_type,
                ip_address,
                metadata
            ) VALUES (
                v_user_id,
                v_jwt_session_id,
                'access_denied_mismatch',
                p_ip,
                jsonb_build_object('reason', 'client_passed_arbitrary_session_id', 'client_session_id', p_session_id)
            );

            RETURN jsonb_build_object(
                'valid', false,
                'code', 'SESSION_ID_MISMATCH',
                'error', 'Identificador de sessão fornecido diverge da assinatura criptográfica do token.'
            );
        END IF;

        v_effective_session_id := v_jwt_session_id;
    ELSE
        IF p_session_id IS NULL THEN
            RETURN jsonb_build_object('valid', false, 'code', 'SESSION_ID_REQUIRED', 'error', 'Identificador de sessão obrigatório.');
        END IF;
        v_effective_session_id := p_session_id;
    END IF;

    SELECT role, status, COALESCE(license_tier, 'student')
    INTO v_role, v_status, v_license_tier
    FROM public.users
    WHERE id = v_user_id;

    -- Fail closed on inactive or suspended account
    IF v_status IS NOT NULL AND NOT (v_status = ANY(ARRAY['active', 'ativo'])) THEN
        RETURN jsonb_build_object(
            'valid', false,
            'code', 'USER_INACTIVE',
            'error', 'Conta suspensa ou inativa. Acesso negado.'
        );
    END IF;

    IF v_license_tier = 'demo' OR v_role = 'demo' THEN
        v_inactivity_minutes := 30;
    ELSIF v_role = 'student' THEN
        v_inactivity_minutes := 60;
    ELSE
        v_inactivity_minutes := 120;
    END IF;

    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'code', 'NO_ACTIVE_SESSION', 'error', 'Nenhuma sessão ativa registrada.');
    END IF;

    -- Check session ID match
    IF v_record.session_id <> v_effective_session_id THEN
        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'access_denied_displaced',
            p_ip,
            jsonb_build_object('reason', 'access_attempt_from_displaced_session')
        );

        -- DO NOT leak active session ID of the other device (P0.3)
        RETURN jsonb_build_object(
            'valid', false,
            'code', 'SESSION_DISPLACED',
            'error', 'Sessão encerrada porque outro dispositivo iniciou acesso nesta conta.',
            'displaced', true,
            'displaced_at', v_record.last_transfer_at
        );
    END IF;

    -- Check status
    IF v_record.status = 'revoked' THEN
        RETURN jsonb_build_object('valid', false, 'code', 'SESSION_REVOKED', 'error', 'Sessão revogada previamente. Faça login novamente.');
    END IF;

    -- Check inactivity
    IF (now() - v_record.last_active_at) > (v_inactivity_minutes || ' minutes')::interval THEN
        UPDATE public.user_active_sessions
        SET status = 'expired',
            revoked_reason = 'inactivity_timeout'
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            v_effective_session_id,
            'inactivity_expired',
            p_ip,
            jsonb_build_object('inactivity_minutes', v_inactivity_minutes)
        );

        RETURN jsonb_build_object(
            'valid', false,
            'code', 'SESSION_EXPIRED_INACTIVITY',
            'error', 'Sessão expirada por inatividade.',
            'expired', true,
            'inactivity_minutes', v_inactivity_minutes
        );
    END IF;

    -- Touch activity timestamp
    IF p_touch_activity THEN
        UPDATE public.user_active_sessions
        SET last_active_at = now(),
            ip_address = COALESCE(p_ip, ip_address)
        WHERE user_id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'valid', true,
        'code', 'SESSION_VALID',
        'session_id', v_effective_session_id,
        'last_active_at', now()
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 7. ATOMIC TIERED AI CONSUMPTION & RATE LIMITER (CRYPTOGRAPHICALLY BOUND)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit_tiered(
    p_session_id uuid,
    p_ip text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
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
        RETURN jsonb_build_object('allowed', false, 'code', 'AUTH_REQUIRED', 'error', 'Autenticação necessária.');
    END IF;

    -- 1. Validate Session Guard (with cryptographic token binding)
    v_validation := public.validate_session_guard(p_session_id, true, p_ip);
    IF (v_validation->>'valid')::boolean IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'code', v_validation->>'code',
            'error', v_validation->>'error',
            'displaced', COALESCE((v_validation->>'displaced')::boolean, false),
            'expired', COALESCE((v_validation->>'expired')::boolean, false)
        );
    END IF;

    -- 2. Determine Tiered AI limits strictly on server based on license_tier / role
    SELECT role, COALESCE(license_tier, 'student')
    INTO v_role, v_license_tier
    FROM public.users
    WHERE id = v_user_id;

    IF v_license_tier = 'demo' OR v_role = 'demo' THEN
        -- Demo Account: 2 queries per 1 minute
        v_max_requests := 2;
        v_window_seconds := 60;
    ELSIF v_role = 'student' THEN
        -- Student Account: 4 queries per 5 minutes (300s)
        v_max_requests := 4;
        v_window_seconds := 300;
    ELSE
        -- Teachers, Admins: 30 queries per 1 minute
        v_max_requests := 30;
        v_window_seconds := 60;
    END IF;

    -- 3. Consume Rate Limit using canonical schema (window_started_at, request_count, updated_at)
    INSERT INTO public.ai_rate_limits (user_id, window_started_at, request_count, updated_at)
    VALUES (v_user_id, now(), 1, now())
    ON CONFLICT (user_id) DO UPDATE
    SET window_started_at = CASE
            WHEN public.ai_rate_limits.window_started_at <= now() - (v_window_seconds || ' seconds')::interval THEN now()
            ELSE public.ai_rate_limits.window_started_at
        END,
        request_count = CASE
            WHEN public.ai_rate_limits.window_started_at <= now() - (v_window_seconds || ' seconds')::interval THEN 1
            ELSE public.ai_rate_limits.request_count + 1
        END,
        updated_at = now()
    RETURNING * INTO v_rate_row;

    IF v_rate_row.request_count > v_max_requests THEN
        v_retry_after := GREATEST(1, v_window_seconds - FLOOR(EXTRACT(EPOCH FROM (now() - v_rate_row.window_started_at)))::integer);

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            ip_address,
            metadata
        ) VALUES (
            v_user_id,
            (v_validation->>'session_id')::uuid,
            'rate_limit_exceeded',
            p_ip,
            jsonb_build_object(
                'max_requests', v_max_requests,
                'window_seconds', v_window_seconds,
                'request_count', v_rate_row.request_count,
                'retry_after_seconds', v_retry_after,
                'license_tier', v_license_tier
            )
        );

        RETURN jsonb_build_object(
            'allowed', false,
            'code', 'AI_RATE_LIMITED',
            'error', 'Limite de consultas à IA atingido para este período. Aguarde um instante.',
            'retry_after_seconds', v_retry_after,
            'max_requests', v_max_requests,
            'window_seconds', v_window_seconds
        );
    END IF;

    RETURN jsonb_build_object(
        'allowed', true,
        'code', 'AUTHORIZED',
        'remaining_in_window', GREATEST(0, v_max_requests - v_rate_row.request_count),
        'max_requests', v_max_requests,
        'window_seconds', v_window_seconds
    );
END;
$$;


-- ------------------------------------------------------------------------------
-- 8. SESSION REVOCATION ROUTINE (LOGOUT)
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
    v_user_id uuid;
    v_caller_role text;
    v_jwt_claims jsonb;
    v_jwt_session_id uuid;
    v_effective_session_id uuid;
    v_record public.user_active_sessions%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    v_caller_role := auth.role();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'AUTH_REQUIRED', 'error', 'Autenticação necessária.');
    END IF;

    v_jwt_claims := auth.jwt();
    v_jwt_session_id := NULLIF(v_jwt_claims ->> 'session_id', '')::uuid;

    IF v_caller_role = 'authenticated' THEN
        v_effective_session_id := COALESCE(v_jwt_session_id, p_session_id);
    ELSE
        v_effective_session_id := p_session_id;
    END IF;

    SELECT * INTO v_record
    FROM public.user_active_sessions
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'revoked', false, 'message', 'Nenhuma sessão ativa encontrada.');
    END IF;

    -- If effective session matches or caller didn't specify
    IF v_effective_session_id IS NULL OR v_record.session_id = v_effective_session_id THEN
        UPDATE public.user_active_sessions
        SET status = 'revoked',
            revoked_reason = p_reason,
            last_active_at = now()
        WHERE user_id = v_user_id;

        INSERT INTO public.session_guard_events (
            user_id,
            session_id,
            event_type,
            metadata
        ) VALUES (
            v_user_id,
            v_record.session_id,
            'session_revoked',
            jsonb_build_object('reason', p_reason)
        );

        RETURN jsonb_build_object('success', true, 'revoked', true, 'status', 'revoked');
    END IF;

    RETURN jsonb_build_object('success', false, 'code', 'SESSION_NOT_ACTIVE', 'error', 'Sessão especificada não é a sessão ativa atual.');
END;
$$;


-- ------------------------------------------------------------------------------
-- 9. ADMINISTRATIVE OVERRIDE / RESET ROUTINE
-- Strictly restricted to service_role and users with super_admin / rector role.
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
    v_caller_id uuid;
    v_caller_role text;
    v_target_record public.user_active_sessions%ROWTYPE;
BEGIN
    v_caller_id := auth.uid();
    v_caller_role := auth.role();

    -- Service role is always authorized
    IF v_caller_role <> 'service_role' THEN
        -- Check if caller is super_admin or rector in public.users
        IF v_caller_id IS NULL THEN
            RAISE EXCEPTION 'UNAUTHORIZED: Authentication required';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = v_caller_id 
              AND role IN ('super_admin', 'rector', 'admin')
              AND status = 'active'
        ) THEN
            RAISE EXCEPTION 'FORBIDDEN: Insufficient administrative privileges';
        END IF;
    END IF;

    SELECT * INTO v_target_record
    FROM public.user_active_sessions
    WHERE user_id = p_target_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', true, 'reset', false, 'message', 'Nenhuma sessão para o usuário informado.');
    END IF;

    UPDATE public.user_active_sessions
    SET status = 'revoked',
        revoked_reason = p_reason,
        transfer_count_today = 0,
        last_active_at = now()
    WHERE user_id = p_target_user_id;

    INSERT INTO public.session_guard_events (
        user_id,
        session_id,
        event_type,
        metadata
    ) VALUES (
        p_target_user_id,
        v_target_record.session_id,
        'admin_reset',
        jsonb_build_object(
            'reset_by_caller_id', v_caller_id,
            'caller_role', v_caller_role,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object('success', true, 'reset', true, 'target_user_id', p_target_user_id);
END;
$$;


-- ------------------------------------------------------------------------------
-- 10. STRICT EXECUTION PRIVILEGES
-- Revoke execution from PUBLIC and anon; Grant strictly to authenticated and service_role.
-- ------------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.register_or_transfer_session FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.validate_session_guard FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_rate_limit_tiered FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.revoke_active_session FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_reset_user_session FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.register_or_transfer_session TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_session_guard TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit_tiered TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_active_session TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_session TO authenticated, service_role;

COMMIT;
