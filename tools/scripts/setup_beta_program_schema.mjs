if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import { runSupabaseSql } from "./supabase_admin_helper.mjs";

async function setupBetaSchema() {
  console.log("=== AETERNUM ATLAS: CRIAÇÃO DO SCHEMA DO PROGRAMA BETA (OPERAÇÃO EL DORADO) ===");

  const sql = `
  -- 1. Criação da Tabela de Candidaturas Beta
  CREATE TABLE IF NOT EXISTS public.beta_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      course TEXT NOT NULL,
      academic_term TEXT NOT NULL,
      student_group TEXT,
      student_id_number TEXT,
      country TEXT NOT NULL DEFAULT 'Brasil',
      primary_device TEXT NOT NULL,
      referral_source TEXT,
      motivation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      batch TEXT NOT NULL DEFAULT 'batch_1_30',
      priority_score INT NOT NULL DEFAULT 0,
      review_notes TEXT,
      reviewed_at TIMESTAMPTZ,
      reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      decision_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      privacy_consent BOOLEAN NOT NULL DEFAULT false,
      terms_consent BOOLEAN NOT NULL DEFAULT false,
      communication_consent BOOLEAN NOT NULL DEFAULT false,
      consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      source_origin TEXT DEFAULT 'web',
      ip_hash TEXT,
      user_agent TEXT,
      CONSTRAINT check_beta_status CHECK (status IN ('pending', 'under_review', 'approved', 'waitlisted', 'rejected', 'invited'))
  );

  -- 2. Índices de Otimização e Prevenção de Duplicidade
  CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_applications_unique_email 
  ON public.beta_applications (lower(trim(email)));

  CREATE INDEX IF NOT EXISTS idx_beta_applications_status 
  ON public.beta_applications (status);

  CREATE INDEX IF NOT EXISTS idx_beta_applications_batch 
  ON public.beta_applications (batch);

  CREATE INDEX IF NOT EXISTS idx_beta_applications_created_at 
  ON public.beta_applications (created_at DESC);

  -- 3. Habilitação de RLS e Políticas de Segurança Estritas
  ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Public can submit beta applications" ON public.beta_applications;
  CREATE POLICY "Public can submit beta applications"
  ON public.beta_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
      status = 'pending' AND
      privacy_consent = true AND
      terms_consent = true AND
      char_length(trim(full_name)) >= 3 AND
      char_length(trim(email)) >= 5 AND
      char_length(trim(institution_name)) >= 2 AND
      char_length(trim(course)) >= 2 AND
      char_length(trim(motivation)) >= 10
  );

  DROP POLICY IF EXISTS "Admins can view all beta applications" ON public.beta_applications;
  CREATE POLICY "Admins can view all beta applications"
  ON public.beta_applications
  FOR SELECT
  TO authenticated
  USING (
      EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'super_admin', 'institution_admin')
      )
  );

  DROP POLICY IF EXISTS "Candidates can view own beta application" ON public.beta_applications;
  CREATE POLICY "Candidates can view own beta application"
  ON public.beta_applications
  FOR SELECT
  TO authenticated
  USING (
      user_id = auth.uid() OR lower(trim(email)) = lower(trim(auth.jwt()->>'email'))
  );

  DROP POLICY IF EXISTS "Admins can update beta applications" ON public.beta_applications;
  CREATE POLICY "Admins can update beta applications"
  ON public.beta_applications
  FOR UPDATE
  TO authenticated
  USING (
      EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'super_admin', 'institution_admin')
      )
  )
  WITH CHECK (
      EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
          AND u.role IN ('admin', 'super_admin', 'institution_admin')
      )
  );

  -- 4. Função RPC Atômica para Submissão Segura
  CREATE OR REPLACE FUNCTION public.submit_beta_application(
      p_full_name TEXT,
      p_email TEXT,
      p_institution_name TEXT,
      p_course TEXT,
      p_academic_term TEXT,
      p_student_group TEXT DEFAULT NULL,
      p_student_id_number TEXT DEFAULT NULL,
      p_country TEXT DEFAULT 'Brasil',
      p_primary_device TEXT DEFAULT 'Desktop Windows',
      p_referral_source TEXT DEFAULT NULL,
      p_motivation TEXT DEFAULT '',
      p_privacy_consent BOOLEAN DEFAULT false,
      p_terms_consent BOOLEAN DEFAULT false,
      p_communication_consent BOOLEAN DEFAULT false,
      p_source_origin TEXT DEFAULT 'web',
      p_ip_hash TEXT DEFAULT NULL,
      p_user_agent TEXT DEFAULT NULL
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
      v_clean_email TEXT;
      v_clean_name TEXT;
      v_clean_inst TEXT;
      v_clean_course TEXT;
      v_clean_term TEXT;
      v_clean_motivation TEXT;
      v_existing_id UUID;
      v_existing_status TEXT;
      v_app_id UUID;
      v_current_count INT;
      v_assigned_batch TEXT := 'batch_1_30';
  BEGIN
      -- Sanitização e normalização
      v_clean_email := lower(trim(p_email));
      v_clean_name := trim(p_full_name);
      v_clean_inst := trim(p_institution_name);
      v_clean_course := trim(p_course);
      v_clean_term := trim(p_academic_term);
      v_clean_motivation := trim(p_motivation);

      -- Validação de Consentimentos Obrigatórios
      IF p_privacy_consent IS NOT TRUE OR p_terms_consent IS NOT TRUE THEN
          RETURN jsonb_build_object(
              'success', false,
              'code', 'CONSENT_REQUIRED',
              'message', 'Os consentimentos de privacidade e termos do programa beta são obrigatórios.'
          );
      END IF;

      -- Validação de Campos Obrigatórios
      IF char_length(v_clean_name) < 3 THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_NAME', 'message', 'Nome completo deve ter pelo menos 3 caracteres.');
      END IF;

      IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_EMAIL', 'message', 'E-mail informado é inválido.');
      END IF;

      IF char_length(v_clean_inst) < 2 THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_INSTITUTION', 'message', 'Informe a universidade ou instituição.');
      END IF;

      IF char_length(v_clean_course) < 2 THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_COURSE', 'message', 'Informe o curso.');
      END IF;

      IF char_length(v_clean_term) < 1 THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_TERM', 'message', 'Informe o ano ou semestre.');
      END IF;

      IF char_length(v_clean_motivation) < 10 THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_MOTIVATION', 'message', 'Apresente uma breve motivação (mínimo de 10 caracteres).');
      END IF;

      -- Verificação de Duplicidade
      SELECT id, status INTO v_existing_id, v_existing_status
      FROM public.beta_applications
      WHERE lower(trim(email)) = v_clean_email;

      IF v_existing_id IS NOT NULL THEN
          RETURN jsonb_build_object(
              'success', false,
              'code', 'ALREADY_REGISTERED',
              'message', 'Este e-mail já possui uma candidatura registrada no Programa Beta da Aeternum Atlas.',
              'status', v_existing_status
          );
      END IF;

      -- Lógica de Lote por Capacidade (Meta 30 -> 50 -> 100)
      SELECT COUNT(*) INTO v_current_count FROM public.beta_applications;
      IF v_current_count < 30 THEN
          v_assigned_batch := 'batch_1_30';
      ELSIF v_current_count < 50 THEN
          v_assigned_batch := 'batch_2_50';
      ELSE
          v_assigned_batch := 'batch_3_100';
      END IF;

      -- Inserção na Tabela de Candidaturas
      INSERT INTO public.beta_applications (
          full_name,
          email,
          institution_name,
          course,
          academic_term,
          student_group,
          student_id_number,
          country,
          primary_device,
          referral_source,
          motivation,
          status,
          batch,
          privacy_consent,
          terms_consent,
          communication_consent,
          consent_timestamp,
          user_id,
          source_origin,
          ip_hash,
          user_agent,
          decision_history
      ) VALUES (
          v_clean_name,
          v_clean_email,
          v_clean_inst,
          v_clean_course,
          v_clean_term,
          trim(p_student_group),
          trim(p_student_id_number),
          COALESCE(NULLIF(trim(p_country), ''), 'Brasil'),
          COALESCE(NULLIF(trim(p_primary_device), ''), 'Desktop Windows'),
          trim(p_referral_source),
          v_clean_motivation,
          'pending',
          v_assigned_batch,
          p_privacy_consent,
          p_terms_consent,
          COALESCE(p_communication_consent, false),
          timezone('utc'::text, now()),
          auth.uid(),
          p_source_origin,
          p_ip_hash,
          p_user_agent,
          jsonb_build_array(
              jsonb_build_object(
                  'status', 'pending',
                  'timestamp', timezone('utc'::text, now()),
                  'action', 'application_submitted',
                  'batch', v_assigned_batch
              )
          )
      ) RETURNING id INTO v_app_id;

      -- Registro de Evento de Auditoria e Plataforma
      BEGIN
          INSERT INTO public.platform_events (
              event_type,
              event_category,
              user_id,
              metadata
          ) VALUES (
              'beta_application_submitted',
              'beta_program',
              auth.uid(),
              jsonb_build_object(
                  'application_id', v_app_id,
                  'email', v_clean_email,
                  'institution', v_clean_inst,
                  'course', v_clean_course,
                  'batch', v_assigned_batch,
                  'admin_notification_recipient', 'aeternumatlas@gmail.com'
              )
          );
      EXCEPTION WHEN OTHERS THEN
          -- Telemetria opcional não deve abortar o cadastro
      END;

      -- Notificação Administrativa
      BEGIN
          INSERT INTO public.institutional_notifications (
              title,
              message,
              type,
              priority,
              status,
              target_audience,
              timezone,
              published_at,
              affected_resources
          ) VALUES (
              'Nova Inscrição Beta: ' || v_clean_name,
              'Candidato: ' || v_clean_name || ' | E-mail: ' || v_clean_email || ' | Instituição: ' || v_clean_inst || ' | Curso: ' || v_clean_course || ' | Notificar: aeternumatlas@gmail.com',
              'institutional_announcement',
              'normal',
              'published',
              'institution_admins',
              'America/Sao_Paulo',
              timezone('utc'::text, now()),
              jsonb_build_object(
                  'module', 'beta_program',
                  'application_id', v_app_id,
                  'batch', v_assigned_batch,
                  'admin_email', 'aeternumatlas@gmail.com'
              )
          );
      EXCEPTION WHEN OTHERS THEN
          -- Preserva integridade da transação
      END;

      RETURN jsonb_build_object(
          'success', true,
          'application_id', v_app_id,
          'status', 'pending',
          'batch', v_assigned_batch,
          'message', 'Candidatura ao Programa Beta registrada com sucesso! Fique atento ao seu e-mail para as próximas comunicações.'
      );
  END;
  $$;

  -- 5. Função RPC Administrativa para Avaliação
  CREATE OR REPLACE FUNCTION public.admin_review_beta_application(
      p_application_id UUID,
      p_new_status TEXT,
      p_review_notes TEXT DEFAULT NULL,
      p_batch TEXT DEFAULT NULL
  )
  RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
  DECLARE
      v_is_admin BOOLEAN := false;
      v_current_app RECORD;
      v_updated_history JSONB;
  BEGIN
      -- Verificar privilégios administrativos
      IF (COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role') THEN
          v_is_admin := true;
      ELSE
          SELECT (role IN ('admin', 'super_admin', 'institution_admin')) INTO v_is_admin
          FROM public.users
          WHERE id = auth.uid();
      END IF;

      IF v_is_admin IS NOT TRUE THEN
          RETURN jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Acesso restrito a administradores.');
      END IF;

      -- Validar novo status
      IF p_new_status NOT IN ('pending', 'under_review', 'approved', 'waitlisted', 'rejected', 'invited') THEN
          RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'message', 'Status administrativo inválido.');
      END IF;

      -- Buscar candidatura
      SELECT * INTO v_current_app
      FROM public.beta_applications
      WHERE id = p_application_id;

      IF NOT FOUND THEN
          RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Candidatura não localizada.');
      END IF;

      -- Anexar ao histórico de decisões
      v_updated_history := COALESCE(v_current_app.decision_history, '[]'::jsonb) || jsonb_build_array(
          jsonb_build_object(
              'from_status', v_current_app.status,
              'to_status', p_new_status,
              'actor_id', auth.uid(),
              'notes', p_review_notes,
              'timestamp', timezone('utc'::text, now()),
              'batch', COALESCE(p_batch, v_current_app.batch)
          )
      );

      UPDATE public.beta_applications
      SET 
          status = p_new_status,
          review_notes = COALESCE(p_review_notes, review_notes),
          reviewed_at = timezone('utc'::text, now()),
          reviewed_by = auth.uid(),
          batch = COALESCE(p_batch, batch),
          decision_history = v_updated_history,
          updated_at = timezone('utc'::text, now())
      WHERE id = p_application_id;

      RETURN jsonb_build_object(
          'success', true,
          'application_id', p_application_id,
          'status', p_new_status,
          'message', 'Avaliação da candidatura registrada com sucesso.'
      );
  END;
  $$;

  -- 6. Concessão de Privilégios
  GRANT SELECT, INSERT ON public.beta_applications TO anon, authenticated;
  GRANT ALL ON public.beta_applications TO service_role;
  GRANT EXECUTE ON FUNCTION public.submit_beta_application TO anon, authenticated, service_role;
  GRANT EXECUTE ON FUNCTION public.admin_review_beta_application TO authenticated, service_role;
  `;

  const res = await runSupabaseSql(sql);
  console.log("Resultado da migração:", res);
  console.log("Schema do Programa Beta criado com sucesso!");
}

setupBetaSchema().catch(err => {
  console.error("FALHA NA CRIAÇÃO DO SCHEMA:", err);
  process.exit(1);
});
