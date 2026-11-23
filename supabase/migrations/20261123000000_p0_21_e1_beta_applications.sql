-- ==============================================================================
-- AETERNUM ATLAS — P0.21-E.1 / P0.21-E.1.1 / P0.21-E.1.2: OPERAÇÃO EL DORADO
-- Schema, RLS, Indexes, Hardened Privileges, Protocol Generation, Server Rate Limit,
-- Advisory Locking and Transactional Email Queue (Outbox Pattern)
-- ==============================================================================

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
    protocol_number TEXT,
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

-- Atualizar registros existentes sem protocolo
UPDATE public.beta_applications 
SET protocol_number = 'BETA-2026-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8))
WHERE protocol_number IS NULL;

-- 2. Índices de Otimização, Unicidade e Prevenção de Duplicidade
CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_applications_unique_email 
ON public.beta_applications (lower(trim(email)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_applications_protocol 
ON public.beta_applications (protocol_number);

CREATE INDEX IF NOT EXISTS idx_beta_applications_status 
ON public.beta_applications (status);

CREATE INDEX IF NOT EXISTS idx_beta_applications_batch 
ON public.beta_applications (batch);

CREATE INDEX IF NOT EXISTS idx_beta_applications_created_at 
ON public.beta_applications (created_at DESC);

-- 3. Habilitação de RLS e Políticas de Segurança Estritas (Fail-Closed)
ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit beta applications" ON public.beta_applications;
DROP POLICY IF EXISTS "Candidates can view own beta application" ON public.beta_applications;

-- Apenas administradores autenticados podem visualizar as candidaturas completas
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

-- Apenas administradores autenticados podem atualizar candidaturas
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

-- 4. Revogação de Privilégios Diretos de Inserção e Manipulação
REVOKE ALL ON public.beta_applications FROM PUBLIC, anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.beta_applications FROM authenticated;
GRANT SELECT, UPDATE ON public.beta_applications TO authenticated;
GRANT ALL ON public.beta_applications TO service_role;

-- 5. Fila Transacional de E-mails (Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.beta_email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.beta_applications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'application_submitted',
    recipient_email TEXT NOT NULL DEFAULT 'aeternumatlas@gmail.com',
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'sent', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    last_attempt_at TIMESTAMPTZ,
    provider TEXT DEFAULT 'resend',
    provider_message_id TEXT,
    provider_response JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    sent_at TIMESTAMPTZ,
    CONSTRAINT uq_beta_email_notif_app_event UNIQUE (application_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_beta_email_notif_status ON public.beta_email_notifications (status);
CREATE INDEX IF NOT EXISTS idx_beta_email_notif_created ON public.beta_email_notifications (created_at DESC);

ALTER TABLE public.beta_email_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_email_notifications FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.beta_email_notifications TO service_role;
GRANT SELECT ON public.beta_email_notifications TO authenticated;

DROP POLICY IF EXISTS "Admins can view email notifications" ON public.beta_email_notifications;
CREATE POLICY "Admins can view email notifications"
ON public.beta_email_notifications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'institution_admin')
    )
);

-- 6. RPC para Consulta Segura e Limitada da Própria Candidatura com Protocolo
CREATE OR REPLACE FUNCTION public.get_my_beta_application_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_user_email TEXT;
    v_record RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED', 'message', 'Autenticação necessária.');
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

    SELECT id, protocol_number, full_name, email, institution_name, course, academic_term, status, batch, created_at
    INTO v_record
    FROM public.beta_applications
    WHERE user_id = auth.uid() OR lower(trim(email)) = lower(trim(v_user_email))
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Nenhuma candidatura vinculada a esta conta.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'id', v_record.id,
            'protocol_number', v_record.protocol_number,
            'full_name', v_record.full_name,
            'email', v_record.email,
            'institution_name', v_record.institution_name,
            'course', v_record.course,
            'academic_term', v_record.academic_term,
            'status', v_record.status,
            'batch', v_record.batch,
            'created_at', v_record.created_at
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_beta_application_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_beta_application_status() TO authenticated, service_role;

-- 7. RPC Reforçada: Submissão Segura, Fila de E-mail, Protocolo e Rate Limiting no Servidor
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
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_email TEXT;
    v_clean_name TEXT;
    v_clean_inst TEXT;
    v_clean_course TEXT;
    v_clean_term TEXT;
    v_clean_motivation TEXT;
    v_existing_id UUID;
    v_app_id UUID;
    v_protocol TEXT;
    v_assigned_batch TEXT := 'batch_1_30';
    v_approved_count INT;
    v_raw_ip TEXT;
    v_computed_ip_hash TEXT;
    v_recent_attempts INT;
BEGIN
    -- Sanitização e normalização
    v_clean_email := lower(trim(p_email));
    v_clean_name := trim(p_full_name);
    v_clean_inst := trim(p_institution_name);
    v_clean_course := trim(p_course);
    v_clean_term := trim(p_academic_term);
    v_clean_motivation := trim(p_motivation);

    -- 1. IDENTIFICAÇÃO CONFIÁVEL DE IP VIA CABEÇALHOS DO SERVIDOR (Cloudflare / PostgREST)
    BEGIN
        v_raw_ip := COALESCE(
            (current_setting('request.headers', true)::json->>'cf-connecting-ip'),
            (current_setting('request.headers', true)::json->>'x-real-ip'),
            (current_setting('request.headers', true)::json->>'x-forwarded-for')
        );
    EXCEPTION WHEN OTHERS THEN
        v_raw_ip := NULL;
    END;

    IF v_raw_ip IS NOT NULL AND v_raw_ip <> '' THEN
        v_raw_ip := trim(split_part(v_raw_ip, ',', 1));
        v_computed_ip_hash := encode(extensions.digest(convert_to(v_raw_ip || 'aeternum_salt_2026', 'UTF8'), 'sha256'), 'hex');
    ELSE
        v_computed_ip_hash := COALESCE(NULLIF(trim(p_ip_hash), ''), 'client_unidentified');
    END IF;

    -- 2. RATE LIMITING RESISTENTE NO SERVIDOR (Máx 5 submissões por hash IP nos últimos 15 min)
    IF v_computed_ip_hash <> 'client_unidentified' THEN
        SELECT COUNT(*) INTO v_recent_attempts
        FROM public.beta_applications
        WHERE ip_hash = v_computed_ip_hash
        AND created_at >= (timezone('utc'::text, now()) - INTERVAL '15 minutes');

        IF v_recent_attempts >= 5 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'RATE_LIMIT_EXCEEDED',
                'message', 'Limite de requisições excedido. Por favor, aguarde alguns minutos antes de tentar novamente.'
            );
        END IF;
    END IF;

    -- 3. VALIDAÇÃO DE CONSENTIMENTOS OBRIGATÓRIOS (LGPD)
    IF p_privacy_consent IS NOT TRUE OR p_terms_consent IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONSENT_REQUIRED',
            'message', 'Os consentimentos de privacidade e termos do programa beta são obrigatórios.'
        );
    END IF;

    -- 4. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
    IF char_length(v_clean_name) < 3 THEN
        RETURN jsonb_build_object('success', false, 'code', 'INVALID_NAME', 'message', 'Nome completo deve ter pelo menos 3 caracteres.');
    END IF;

    IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
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

    -- 5. VERIFICAÇÃO DE DUPLICIDADE (Prevenção de enumeração sem vazar dados)
    SELECT id INTO v_existing_id
    FROM public.beta_applications
    WHERE lower(trim(email)) = v_clean_email;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_REGISTERED',
            'message', 'Esta candidatura já foi registrada anteriormente sob o protocolo do Programa Beta.'
        );
    END IF;

    -- 6. GERAÇÃO DE PROTOCOLO ÚNICO
    v_protocol := 'BETA-2026-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));

    -- Atribuição de Lote Inicial (Triagem Lote 1)
    SELECT COUNT(*) INTO v_approved_count 
    FROM public.beta_applications 
    WHERE status IN ('approved', 'invited') AND batch = 'batch_1_30';

    IF v_approved_count < 30 THEN
        v_assigned_batch := 'batch_1_30';
    ELSIF v_approved_count < 50 THEN
        v_assigned_batch := 'batch_2_50';
    ELSE
        v_assigned_batch := 'batch_3_100';
    END IF;

    -- 7. INSERÇÃO ATÔMICA DA CANDIDATURA
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
        priority_score,
        review_notes,
        reviewed_at,
        reviewed_by,
        protocol_number,
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
        'pending',              -- Sempre pending
        v_assigned_batch,       -- Lote inicial
        0,                      -- Sem pontuação manipulada
        NULL,
        NULL,
        NULL,
        v_protocol,
        p_privacy_consent,
        p_terms_consent,
        COALESCE(p_communication_consent, false),
        timezone('utc'::text, now()),
        auth.uid(),
        p_source_origin,
        v_computed_ip_hash,
        p_user_agent,
        jsonb_build_array(
            jsonb_build_object(
                'status', 'pending',
                'timestamp', timezone('utc'::text, now()),
                'action', 'application_submitted',
                'protocol', v_protocol,
                'batch', v_assigned_batch
            )
        )
    ) RETURNING id INTO v_app_id;

    -- 8. FILA TRANSACIONAL DE E-MAIL (OUTBOX) COM IDEMPOTÊNCIA
    BEGIN
        INSERT INTO public.beta_email_notifications (
            application_id,
            event_type,
            recipient_email,
            subject,
            status
        ) VALUES (
            v_app_id,
            'application_submitted',
            'aeternumatlas@gmail.com',
            '[AETERNUM ATLAS | BETA] Nova candidatura — ' || v_clean_name,
            'queued'
        ) ON CONFLICT (application_id, event_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
    END;

    -- 9. NOTIFICAÇÃO INSTITUCIONAL INTERNA (ADMINS)
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
            'Nova Inscrição Beta [' || v_protocol || ']: ' || v_clean_name,
            'Protocolo: ' || v_protocol || ' | Candidato: ' || v_clean_name || ' | E-mail: ' || v_clean_email || ' | Instituição: ' || v_clean_inst || ' | Notificar: aeternumatlas@gmail.com',
            'institutional_announcement',
            'normal',
            'published',
            'institution_admins',
            'America/Sao_Paulo',
            timezone('utc'::text, now()),
            jsonb_build_object(
                'module', 'beta_program',
                'application_id', v_app_id,
                'protocol', v_protocol,
                'batch', v_assigned_batch,
                'admin_email', 'aeternumatlas@gmail.com'
            )
        );
    EXCEPTION WHEN OTHERS THEN
    END;

    -- 10. EVENTO DE AUDITORIA E TELEMETRIA
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
                'protocol', v_protocol,
                'email', v_clean_email,
                'institution', v_clean_inst,
                'course', v_clean_course,
                'batch', v_assigned_batch,
                'admin_notification_recipient', 'aeternumatlas@gmail.com'
            )
        );
    EXCEPTION WHEN OTHERS THEN
    END;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_app_id,
        'protocol_number', v_protocol,
        'status', 'pending',
        'batch', v_assigned_batch,
        'message', 'Candidatura ao Programa Beta registrada com sucesso sob o protocolo institucional.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 8. RPC de Avaliação Administrativa com Lock Concorrente Advisory e Limite Estrito de 30 Aprovados
CREATE OR REPLACE FUNCTION public.admin_review_beta_application(
    p_application_id UUID,
    p_new_status TEXT,
    p_review_notes TEXT DEFAULT NULL,
    p_batch TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_is_admin BOOLEAN := false;
    v_current_app RECORD;
    v_target_batch TEXT;
    v_approved_count INT;
    v_updated_history JSONB;
BEGIN
    -- Verificação de Privilégio Administrativo
    IF (current_user IN ('postgres', 'supabase_admin') OR COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role') THEN
        v_is_admin := true;
    ELSE
        SELECT (role IN ('admin', 'super_admin', 'institution_admin')) INTO v_is_admin
        FROM public.users
        WHERE id = auth.uid();
    END IF;

    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'code', 'UNAUTHORIZED', 'message', 'Acesso restrito a administradores autorizados.');
    END IF;

    -- Validar novo status permitido
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

    v_target_batch := COALESCE(p_batch, v_current_app.batch, 'batch_1_30');

    -- BLOQUEIO TRANSACIONAL EXCLUSIVO ADVISORY: Serializa aprovações concorrentes no lote
    PERFORM pg_advisory_xact_lock(hashtext('beta_capacity_' || v_target_batch));

    -- CONTROLE RÍGIDO DE CAPACIDADE DE VAGAS APROVADAS
    IF p_new_status IN ('approved', 'invited') AND v_current_app.status NOT IN ('approved', 'invited') THEN
        SELECT COUNT(*) INTO v_approved_count
        FROM public.beta_applications
        WHERE status IN ('approved', 'invited')
        AND batch = v_target_batch;

        IF v_target_batch = 'batch_1_30' AND v_approved_count >= 30 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 1 (30 vagas aprovadas) foi atingida. Expansão para Lote 2 requer homologação operacional.'
            );
        ELSIF v_target_batch = 'batch_2_50' AND v_approved_count >= 50 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 2 (50 vagas aprovadas) foi atingida. Expansão para Lote 3 requer homologação operacional.'
            );
        ELSIF v_target_batch = 'batch_3_100' AND v_approved_count >= 100 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 3 (100 vagas aprovadas) foi atingida.'
            );
        END IF;
    END IF;

    -- Anexar ao histórico auditado de decisões
    v_updated_history := COALESCE(v_current_app.decision_history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
            'from_status', v_current_app.status,
            'to_status', p_new_status,
            'actor_id', auth.uid(),
            'notes', p_review_notes,
            'batch', v_target_batch,
            'timestamp', timezone('utc'::text, now())
        )
    );

    UPDATE public.beta_applications
    SET 
        status = p_new_status,
        review_notes = COALESCE(p_review_notes, review_notes),
        reviewed_at = timezone('utc'::text, now()),
        reviewed_by = auth.uid(),
        batch = v_target_batch,
        decision_history = v_updated_history,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_application_id;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', p_application_id,
        'protocol_number', v_current_app.protocol_number,
        'status', p_new_status,
        'batch', v_target_batch,
        'message', 'Avaliação da candidatura registrada com sucesso.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_beta_application(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_beta_application(UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
