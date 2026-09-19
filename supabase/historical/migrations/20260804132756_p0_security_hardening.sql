-- AETERNUM 26 — P0: ENDURECIMENTO APÓS AUDITORIA DO DATABASE LINTER

-- As visões analíticas passam a respeitar as permissões e o RLS do usuário.
ALTER VIEW public.institution_usage_summary SET (security_invoker = true);
ALTER VIEW public.model_popularity_summary SET (security_invoker = true);
ALTER VIEW public.user_engagement_summary SET (security_invoker = true);

-- Função de trigger com caminho de busca imutável.
ALTER FUNCTION public.touch_model_annotations_sync()
  SET search_path = public, pg_temp;

-- Helpers de identidade são necessários para políticas RLS, mas nunca para anon.
REVOKE ALL ON FUNCTION public.current_user_institution_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_institution_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

-- Faturamento é uma operação de servidor; clientes não podem invocá-la diretamente.
REVOKE ALL ON FUNCTION public.generate_monthly_invoice(UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_invoice(UUID, UUID) TO service_role;

-- A origem histórica é estritamente somente leitura. A telemetria V2 é a fonte oficial.
REVOKE INSERT, UPDATE, DELETE ON public.model_access_logs FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Permitir inserção de logs de acesso por todos" ON public.model_access_logs;
DROP POLICY IF EXISTS "Users can insert own model access logs" ON public.model_access_logs;

-- Índices exigidos pelos relacionamentos e consultas do Tutor IA.
CREATE INDEX IF NOT EXISTS ai_messages_user_created_idx
  ON public.ai_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_audit_events_conversation_idx
  ON public.ai_audit_events(conversation_id);
