-- ==============================================================================
-- AETERNUM ATLAS — ROLLBACK PLAN FOR SECURITY HARDENING MIGRATION
-- Rollback for: 20261116000000_harden_security_definer_public_privileges.sql
-- Description: Restores previous grant state if required by legacy dependencies.
-- ==============================================================================

BEGIN;

-- Restore public/anon execute on destructive & admin functions
GRANT EXECUTE ON FUNCTION public.reset_all_submissions() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_participant_submissions(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_submission_by_id(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_submissions_by_week(integer) TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.verify_admin_access(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_study_for_participant(uuid, date, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.regenerate_participant_token(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_or_create_participant_by_name(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_participant_by_name(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_researcher_role() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_research_participants() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_research_submissions() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.check_participant_prosthesis_consistency() TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_participant_portal_data(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_participant_questionnaire(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_participant_follow_up(uuid, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_vita_sovereign_knowledge(text, text[], text, integer) TO anon, authenticated, service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_events') THEN
    INSERT INTO public.security_events (event_type, details, created_at)
    VALUES (
      'security_definer_hardening_rolled_back',
      jsonb_build_object(
        'rollback_file', 'rollback_20261116000000_harden_security_definer_public_privileges.sql',
        'status', 'complete'
      ),
      now()
    );
  END IF;
END $$;

COMMIT;
