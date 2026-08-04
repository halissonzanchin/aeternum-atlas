-- AETERNUM 26 — P0: LIMPEZA DE IDENTIDADE E TENANTS LEGADOS
-- Operação transacional e auditável. O tenant oficial é protegido explicitamente.

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

DO $$
DECLARE
  official_id UUID;
  upe_id UUID;
  test_id UUID;
  orphan_emails CONSTANT TEXT[] := ARRAY[
    'coordenador@upe.edu.py',
    'demo@upe.edu.py',
    'professor@upe.edu.py',
    'reitor@upe.edu.py'
  ];
  matched_orphans INTEGER;
  official_profiles INTEGER;
  orphan_auth_identities INTEGER;
BEGIN
  SELECT id INTO official_id
  FROM public.institutions
  WHERE name = 'Aeternum Atlas Oficial';

  SELECT id INTO upe_id
  FROM public.institutions
  WHERE name = 'UPE - Presidente Franco';

  SELECT id INTO test_id
  FROM public.institutions
  WHERE name = 'Aeternum Test University';

  IF official_id IS NULL THEN
    RAISE EXCEPTION 'Tenant oficial ausente ou divergente; limpeza cancelada.';
  END IF;

  SELECT COUNT(*) INTO official_profiles
  FROM public.users
  WHERE institution_id = official_id AND status IN ('active', 'ativo');

  IF official_profiles < 6 THEN
    RAISE EXCEPTION 'Tenant oficial possui apenas % perfis ativos; limpeza cancelada.', official_profiles;
  END IF;

  -- Reaplicação segura: se ambos os tenants legados já foram removidos,
  -- a migração termina sem tocar no tenant oficial.
  IF upe_id IS NULL AND test_id IS NULL THEN
    RETURN;
  END IF;

  IF upe_id IS NULL OR test_id IS NULL THEN
    RAISE EXCEPTION 'Apenas um tenant legado permanece; estado inconsistente e limpeza cancelada.';
  END IF;

  SELECT COUNT(*) INTO matched_orphans
  FROM public.users
  WHERE institution_id = upe_id AND lower(email) = ANY(orphan_emails);

  IF matched_orphans <> 4 THEN
    RAISE EXCEPTION 'Esperados 4 perfis órfãos UPE, encontrados %; limpeza cancelada.', matched_orphans;
  END IF;

  SELECT COUNT(*) INTO orphan_auth_identities
  FROM auth.users AS identity
  WHERE lower(identity.email) = ANY(orphan_emails);

  IF orphan_auth_identities <> 0 THEN
    RAISE EXCEPTION 'Há % identidades Auth para os perfis declarados órfãos; limpeza cancelada.', orphan_auth_identities;
  END IF;

  -- Arquivo de restauração antes de cada mutação material.
  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'users', id::TEXT, to_jsonb(profile)
  FROM public.users AS profile
  WHERE profile.institution_id = upe_id AND lower(profile.email) = ANY(orphan_emails)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'institutions', id::TEXT, to_jsonb(institution)
  FROM public.institutions AS institution
  WHERE institution.id IN (upe_id, test_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'models_3d', id::TEXT, to_jsonb(model)
  FROM public.models_3d AS model
  WHERE model.institution_id = test_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'anatomical_quizzes', id::TEXT, to_jsonb(quiz)
  FROM public.anatomical_quizzes AS quiz
  WHERE quiz.institution_id = test_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'model_annotations', id::TEXT, to_jsonb(annotation)
  FROM public.model_annotations AS annotation
  WHERE annotation.institution_id = test_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'security_events', id::TEXT, to_jsonb(event)
  FROM public.security_events AS event
  WHERE event.institution_id = upe_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'billing_snapshots', id::TEXT, to_jsonb(snapshot)
  FROM public.billing_snapshots AS snapshot
  WHERE snapshot.institution_id = upe_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'institution_subscriptions', id::TEXT, to_jsonb(subscription)
  FROM public.institution_subscriptions AS subscription
  WHERE subscription.institution_id = upe_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'invoices', id::TEXT, to_jsonb(invoice)
  FROM public.invoices AS invoice
  WHERE invoice.institution_id = upe_id
  ON CONFLICT DO NOTHING;

  INSERT INTO public.legacy_cleanup_archive (operation_key, source_table, source_id, source_payload)
  SELECT 'aeternum26-p0-20260804', 'license_usage', id::TEXT, to_jsonb(usage)
  FROM public.license_usage AS usage
  WHERE usage.institution_id = upe_id
  ON CONFLICT DO NOTHING;

  -- O acervo atual deixa o tenant de teste antes de sua remoção.
  UPDATE public.models_3d SET institution_id = official_id WHERE institution_id = test_id;
  UPDATE public.anatomical_quizzes SET institution_id = official_id WHERE institution_id = test_id;
  UPDATE public.model_annotations SET institution_id = official_id WHERE institution_id = test_id;

  -- Resíduos UPE sem identidade Auth correspondente.
  DELETE FROM public.security_events WHERE institution_id = upe_id;
  DELETE FROM public.billing_snapshots WHERE institution_id = upe_id;
  DELETE FROM public.invoices WHERE institution_id = upe_id;
  DELETE FROM public.institution_subscriptions WHERE institution_id = upe_id;
  DELETE FROM public.license_usage WHERE institution_id = upe_id;
  DELETE FROM public.users
  WHERE institution_id = upe_id AND lower(email) = ANY(orphan_emails);

  -- Somente os tenants legados são removidos. O tenant oficial nunca entra neste conjunto.
  DELETE FROM public.institutions WHERE id IN (upe_id, test_id);

  IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = ANY(orphan_emails)) THEN
    RAISE EXCEPTION 'Perfis órfãos permaneceram após a limpeza; transação cancelada.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.institutions WHERE id IN (upe_id, test_id)) THEN
    RAISE EXCEPTION 'Tenants legados permaneceram após a limpeza; transação cancelada.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.institutions WHERE id = official_id) THEN
    RAISE EXCEPTION 'Proteção do tenant oficial violada; transação cancelada.';
  END IF;
END;
$$;
