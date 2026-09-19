-- ============================================================================
-- Aeternum Atlas — Canonical Baseline Cutover Marker
-- Version: 20260918000000
-- ============================================================================
-- This marker marks the cutover to the canonical fresh-install baseline.
-- On fresh environments, the baseline snapshot is applied during bootstrap,
-- and this version is recorded in supabase_migrations.schema_migrations.
-- On existing environments, this migration acts as an idempotent verification.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'atlas_models'
  ) THEN
    RAISE EXCEPTION 'Aeternum Atlas canonical baseline tables not found.';
  END IF;
END $$;
