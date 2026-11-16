-- ==============================================================================
-- AETERNUM ATLAS — ROLLBACK PLAN: P0 SESSION GUARD (AUDITADO P0.3)
-- Migration: rollback_20261116010000_aeternum_session_guard_single_session_policy.sql
-- Description: Cleanly revokes privileges, drops functions, policies, indexes,
--              user attributes and tables introduced by the Session Guard migration.
-- ==============================================================================

BEGIN;

-- 1. Drop Functions
DROP FUNCTION IF EXISTS public.admin_reset_user_session(uuid, text);
DROP FUNCTION IF EXISTS public.revoke_active_session(uuid, text);
DROP FUNCTION IF EXISTS public.consume_ai_rate_limit_tiered(uuid, text);
DROP FUNCTION IF EXISTS public.validate_session_guard(uuid, boolean, text);
DROP FUNCTION IF EXISTS public.register_or_transfer_session(uuid, text, text, boolean, jsonb);

-- 2. Drop Policies
DROP POLICY IF EXISTS user_active_sessions_select_own ON public.user_active_sessions;
DROP POLICY IF EXISTS session_guard_events_select_own ON public.session_guard_events;
DROP POLICY IF EXISTS ai_rate_limits_select_own ON public.ai_rate_limits;

-- 3. Drop Tables and Indexes
DROP TABLE IF EXISTS public.session_guard_events CASCADE;
DROP TABLE IF EXISTS public.user_active_sessions CASCADE;

-- 4. Clean user attributes added for progressive rollout
ALTER TABLE public.users DROP COLUMN IF EXISTS license_tier;
ALTER TABLE public.users DROP COLUMN IF EXISTS session_guard_enabled;

COMMIT;
