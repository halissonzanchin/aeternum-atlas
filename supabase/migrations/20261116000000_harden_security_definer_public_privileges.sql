-- ==============================================================================
-- AETERNUM ATLAS — SECURITY HARDENING MIGRATION
-- Migration: 20261116000000_harden_security_definer_public_privileges.sql
-- Description: Revoke public/anon execute privileges on sensitive SECURITY DEFINER
--              routines while preserving legitimate volunteer portal & search flows.
-- Pre-conditions: PostgreSQL 15+, public schema initialized, auth & private schemas present.
-- Rollback Plan: supabase/rollback-plans/rollback_20261116000000_harden_security_definer_public_privileges.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. DESTRUCTIVE / HIGH RISK FUNCTIONS (CRITICAL PRIORITY)
-- Restrict exclusively to service_role (Admin CLI / Automated Background Workers)
-- ------------------------------------------------------------------------------

-- Reset all submissions (Destructive clinical study wipe)
REVOKE EXECUTE ON FUNCTION public.reset_all_submissions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_all_submissions() TO service_role;

-- Delete submissions by participant
REVOKE EXECUTE ON FUNCTION public.delete_participant_submissions(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_participant_submissions(uuid) TO service_role;

-- Delete specific submission by id
REVOKE EXECUTE ON FUNCTION public.delete_submission_by_id(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_submission_by_id(uuid) TO service_role;

-- Delete submissions by study week
REVOKE EXECUTE ON FUNCTION public.delete_submissions_by_week(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_submissions_by_week(integer) TO service_role;


-- ------------------------------------------------------------------------------
-- 2. ADMINISTRATIVE & RESEARCH MANAGEMENT FUNCTIONS
-- Restrict to authenticated researchers and service_role (Revoke from anon)
-- ------------------------------------------------------------------------------

-- Administrative legacy credential check
REVOKE EXECUTE ON FUNCTION public.verify_admin_access(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_access(text) TO service_role;

-- Activate study for participant (Modifies study schedule)
REVOKE EXECUTE ON FUNCTION public.activate_study_for_participant(uuid, date, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_study_for_participant(uuid, date, uuid) TO authenticated, service_role;

-- Regenerate participant security token
REVOKE EXECUTE ON FUNCTION public.regenerate_participant_token(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.regenerate_participant_token(uuid, text) TO authenticated, service_role;

-- Create or fetch participant by name
REVOKE EXECUTE ON FUNCTION public.get_or_create_participant_by_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_participant_by_name(text) TO authenticated, service_role;

-- Verify participant by name
REVOKE EXECUTE ON FUNCTION public.verify_participant_by_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_participant_by_name(text) TO authenticated, service_role;

-- Check researcher role
REVOKE EXECUTE ON FUNCTION public.get_current_researcher_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_researcher_role() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 3. CLINICAL DATA INSPECTION & READ FUNCTIONS
-- Restrict to authenticated clinical researchers and service_role (Revoke from anon)
-- ------------------------------------------------------------------------------

-- Get all research participants
REVOKE EXECUTE ON FUNCTION public.get_research_participants() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_research_participants() TO authenticated, service_role;

-- Get all research submissions
REVOKE EXECUTE ON FUNCTION public.get_research_submissions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_research_submissions() TO authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 4. INTERNAL DATABASE TRIGGERS
-- Internal trigger functions must never be directly callable via RPC
-- ------------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.check_participant_prosthesis_consistency() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_participant_prosthesis_consistency() TO service_role;


-- ------------------------------------------------------------------------------
-- 5. VOLUNTEER PORTAL & AI SEARCH (LEGITIMATE FLOWS PRESERVED)
-- These routines validate internal security tokens (p_token) or are needed by students
-- Explicitly reaffirm least-privilege grants
-- ------------------------------------------------------------------------------

-- Volunteer portal data load (Protected by p_token validated inside private schema)
GRANT EXECUTE ON FUNCTION public.get_participant_portal_data(text) TO anon, authenticated, service_role;

-- Volunteer portal survey submission (Protected by p_token validated inside private schema)
GRANT EXECUTE ON FUNCTION public.submit_participant_questionnaire(text, jsonb) TO anon, authenticated, service_role;

-- Volunteer portal follow-up submission (Protected by session token)
GRANT EXECUTE ON FUNCTION public.submit_participant_follow_up(uuid, text, jsonb) TO anon, authenticated, service_role;

-- Aeternum Vita Sovereign Knowledge Vector Search (Operational retrieval for AI)
GRANT EXECUTE ON FUNCTION public.match_vita_sovereign_knowledge(text, text[], text, integer) TO anon, authenticated, service_role;


-- ------------------------------------------------------------------------------
-- 6. VERIFICATION AUDIT LOG
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    INSERT INTO public.audit_logs (action, target_table, metadata, created_at)
    VALUES (
      'security_definer_hardening_applied',
      'routines',
      jsonb_build_object(
        'migration', '20261116000000_harden_security_definer_public_privileges.sql',
        'revoked_count', 13,
        'preserved_count', 4,
        'status', 'complete'
      ),
      now()
    );
  END IF;
END $$;

COMMIT;
