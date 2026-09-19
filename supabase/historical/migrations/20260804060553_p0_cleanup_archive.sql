-- AETERNUM 26 — P0: ARQUIVO AUDITÁVEL PARA LIMPEZA DE LEGADOS

CREATE TABLE IF NOT EXISTS public.legacy_cleanup_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_key TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_id TEXT,
  source_payload JSONB NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by UUID DEFAULT auth.uid(),
  UNIQUE (operation_key, source_table, source_id)
);

ALTER TABLE public.legacy_cleanup_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.legacy_cleanup_archive FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.legacy_cleanup_archive TO service_role;
