-- Migration: 20260921010000_grant_ai_tutor_runtime_privileges.sql
-- Description: Codify minimal least-privilege runtime grants for ai-tutor Edge Function

BEGIN;

-- Object-level table grants for service_role
GRANT SELECT ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ai_conversations TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.ai_messages TO service_role;
GRANT INSERT ON TABLE public.ai_audit_events TO service_role;

-- Routine execution grants
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_anatomical_knowledge(vector, double precision, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.match_vita_anatomical_knowledge(text, integer) TO service_role;

COMMIT;
