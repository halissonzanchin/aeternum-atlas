-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO P0.21-E.4: ALINHAMENTO DO ASSUNTO INSTITUCIONAL
-- OPERAÇÃO EL DORADO · PADRONIZAÇÃO DE NOTIFICAÇÕES PARA AETERNUMATLAS@GMAIL.COM
-- ==============================================================================

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
    p_motivation TEXT DEFAULT NULL,
    p_privacy_consent BOOLEAN DEFAULT false,
    p_terms_consent BOOLEAN DEFAULT false,
    p_communication_consent BOOLEAN DEFAULT false,
    p_source_origin TEXT DEFAULT 'landing_beta',
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
    v_server_salt TEXT;
    v_is_registration_open BOOLEAN;
    v_is_privileged_caller BOOLEAN := false;
    v_service_key TEXT;
BEGIN
    -- Sanitização e normalização estrita
    v_clean_email := lower(trim(p_email));
    v_clean_name := trim(p_full_name);
    v_clean_inst := trim(p_institution_name);
    v_clean_course := trim(p_course);
    v_clean_term := trim(p_academic_term);
    v_clean_motivation := trim(p_motivation);

    -- Determinar se é chamada de serviço interno (service_role) ou administrador autenticado
    -- ZERO uso de current_user
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' THEN
        v_is_privileged_caller := true;
    ELSIF auth.uid() IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() 
            AND u.role IN ('admin', 'super_admin')
        ) INTO v_is_privileged_caller;
    ELSE
        v_is_privileged_caller := false;
    END IF;

    -- 1. CONTROLE ESTRITO DE ABERTURA SERVER-SIDE (PRÉ-LANÇAMENTO)
    SELECT COALESCE((setting_value = 'true'), false) INTO v_is_registration_open
    FROM public.platform_system_settings
    WHERE setting_key = 'beta_registration_open';

    IF NOT v_is_registration_open AND NOT v_is_privileged_caller THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'BETA_REGISTRATION_PRELAUNCH',
            'status', 'pre_launch',
            'message', 'As inscrições para a 1ª Turma do Programa de Teste Beta (Operação El Dorado) serão abertas oficialmente na primeira semana de dezembro de 2026. Acompanhe os canais oficiais da Aeternum Atlas.'
        );
    END IF;

    -- 2. IDENTIFICAÇÃO CONFIÁVEL DE IP NO SERVIDOR (Zero confiança em parâmetro do cliente)
    BEGIN
        v_raw_ip := COALESCE(
            (current_setting('request.headers', true)::json->>'cf-connecting-ip'),
            (current_setting('request.headers', true)::json->>'x-real-ip'),
            (current_setting('request.headers', true)::json->>'x-forwarded-for')
        );
    EXCEPTION WHEN OTHERS THEN
        v_raw_ip := NULL;
    END;

    -- Recuperar salt persistente do servidor
    SELECT setting_value INTO v_server_salt
    FROM public.platform_system_settings
    WHERE setting_key = 'server_rate_limit_salt';

    IF v_server_salt IS NULL OR v_server_salt = '' THEN
        v_server_salt := 'aeternum_master_secure_salt_2026';
    END IF;

    IF v_raw_ip IS NOT NULL AND v_raw_ip <> '' THEN
        v_raw_ip := trim(split_part(v_raw_ip, ',', 1));
        v_computed_ip_hash := encode(extensions.digest(convert_to(v_raw_ip || v_server_salt, 'UTF8'), 'sha256'), 'hex');
    ELSE
        v_computed_ip_hash := encode(extensions.digest(convert_to(inet_client_addr()::text || v_server_salt, 'UTF8'), 'sha256'), 'hex');
    END IF;

    -- 3. RATE LIMITING PERSISTENTE NO SERVIDOR (Máx 5 submissões por hash IP em 15 min)
    IF NOT v_is_privileged_caller THEN
        SELECT COUNT(*) INTO v_recent_attempts
        FROM public.beta_applications
        WHERE ip_hash = v_computed_ip_hash
        AND created_at >= (timezone('utc'::text, now()) - INTERVAL '15 minutes');

        IF v_recent_attempts >= 5 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'RATE_LIMIT_EXCEEDED',
                'message', 'Limite de requisições excedido para este endereço. Por favor, aguarde alguns minutos antes de tentar novamente.'
            );
        END IF;
    END IF;

    -- 4. VALIDAÇÃO DE CONSENTIMENTOS OBRIGATÓRIOS (LGPD)
    IF p_privacy_consent IS NOT TRUE OR p_terms_consent IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'CONSENT_REQUIRED',
            'message', 'Os consentimentos de privacidade e termos do programa beta são obrigatórios.'
        );
    END IF;

    -- 5. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
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

    -- 6. PROTEÇÃO CONTRA ENUMERAÇÃO DE E-MAILS (ANTI-ENUMERATION)
    SELECT id, protocol_number INTO v_existing_id, v_protocol
    FROM public.beta_applications
    WHERE lower(trim(email)) = v_clean_email;

    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'code', 'APPLICATION_RECORDED',
            'protocol_number', v_protocol,
            'status', 'pending',
            'message', 'Sua candidatura já está registrada e em análise pela comissão acadêmica.'
        );
    END IF;

    -- 7. GERAÇÃO DE PROTOCOLO ÚNICO CANÔNICO
    v_protocol := 'BETA-2026-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));

    -- Atribuição de Lote Inicial (1ª Turma)
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

    -- 8. INSERÇÃO ATÔMICA DA CANDIDATURA (Status inicial estritamente 'pending')
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
        'pending',              -- SEMPRE pending na submissão
        v_assigned_batch,       -- Lote inicial
        0,                      -- Sem pontuação manipulada
        NULL,                   -- Sem notas iniciais
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

    -- 9. INSERÇÃO NA FILA TRANSACIONAL DE E-MAIL (OUTBOX) COM IDEMPOTÊNCIA E ASSUNTO PADRONIZADO
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
            '[AETERNUM ATLAS | OPERAÇÃO EL DORADO] Nova candidatura Beta — ' || v_clean_name,
            'queued'
        ) ON CONFLICT (application_id, event_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        -- Falha na fila jamais cancela a inscrição do candidato
    END;

    -- 10. DISPARO ASSÍNCRONO NÃO-BLOQUEANTE VIA PG_NET UTILIZANDO SUPABASE VAULT
    BEGIN
        SELECT decrypted_secret INTO v_service_key
        FROM vault.decrypted_secrets
        WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';

        IF v_service_key IS NOT NULL AND v_service_key <> '' THEN
            PERFORM net.http_post(
                url := 'https://hyivyrietgjdazgizafp.supabase.co/functions/v1/send-beta-notification',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_key
                ),
                body := jsonb_build_object(
                    'application_id', v_app_id,
                    'trigger', 'pg_net_async_dispatch'
                )
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Chamada de rede assíncrona tolerante a falhas
    END;

    -- 11. NOTIFICAÇÃO INSTITUCIONAL INTERNA (ADMINS)
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
            'info',
            'high',
            'active',
            'admins',
            'America/Sao_Paulo',
            timezone('utc'::text, now()),
            jsonb_build_object('application_id', v_app_id, 'protocol_number', v_protocol, 'batch', v_assigned_batch)
        );
    EXCEPTION WHEN OTHERS THEN
        -- Notificação institucional não bloqueante
    END;

    -- 12. RETORNO DE SUCESSO AO CLIENTE
    RETURN jsonb_build_object(
        'success', true,
        'code', 'APPLICATION_ACCEPTED',
        'application_id', v_app_id,
        'protocol_number', v_protocol,
        'status', 'pending',
        'batch', v_assigned_batch,
        'message', 'Candidatura submetida com sucesso! Seu protocolo é ' || v_protocol || '. A seleção dos 30 participantes da 1ª Turma será realizada e comunicada no início de dezembro.'
    );
END;
$$;

-- Permissões estritas da RPC
REVOKE ALL ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;
