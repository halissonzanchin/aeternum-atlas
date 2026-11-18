-- ==============================================================================
-- AETERNUM ATLAS — P0.14: ROLLBACK PLAN
-- Migration: rollback_20261118000000_p0_14_institutional_notifications.sql
-- Description: Reverte de forma limpa e segura as estruturas da Central de
--              Notificações Institucionais sem impactar Session Guard, Prometheus
--              ou tabelas acadêmicas.
-- ==============================================================================

BEGIN;

-- 1. Remover Tabelas na ordem correta de integridade referencial (remove também triggers e policies dependentes)
DROP TABLE IF EXISTS public.notification_audit_log CASCADE;
DROP TABLE IF EXISTS public.user_notification_reads CASCADE;
DROP TABLE IF EXISTS public.institutional_notifications CASCADE;

-- 2. Revogar permissões das funções RPC
REVOKE ALL ON FUNCTION public.get_student_notifications(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_all_notifications_as_read() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notification_as_read(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_notification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_current_user_institution_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_super_admin_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated;

-- 3. Remover funções RPC e auxiliares
DROP FUNCTION IF EXISTS public.get_student_notifications(integer, integer);
DROP FUNCTION IF EXISTS public.mark_all_notifications_as_read();
DROP FUNCTION IF EXISTS public.mark_notification_as_read(uuid);
DROP FUNCTION IF EXISTS public.can_manage_notification(uuid);
DROP FUNCTION IF EXISTS public.get_current_user_institution_id();
DROP FUNCTION IF EXISTS public.is_super_admin_user();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- 4. Remover Funções de Trigger
DROP FUNCTION IF EXISTS public.trg_institutional_notifications_audit();
DROP FUNCTION IF EXISTS public.trg_institutional_notifications_timestamps();

COMMIT;
