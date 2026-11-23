-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO P0.21-HF.1: HOTFIX MASTER DE SEGURANÇA
-- OPERAÇÃO EL DORADO · HARDENING DE AUTORIZAÇÃO, FILA E SEGREDOS NO VAULT
-- ==============================================================================

-- 1. MIGRAÇÃO CRIPTOGRÁFICA DO SEGREDO PARA O SUPABASE VAULT
DO $$
DECLARE
    v_raw_key text;
    v_existing_id uuid;
BEGIN
    SELECT setting_value INTO v_raw_key
    FROM public.platform_system_settings
    WHERE setting_key = 'supabase_service_role_key';

    IF v_raw_key IS NOT NULL AND v_raw_key <> '' THEN
        SELECT id INTO v_existing_id
        FROM vault.secrets
        WHERE name = 'INTERNAL_SERVICE_ROLE_KEY';

        IF v_existing_id IS NULL THEN
            PERFORM vault.create_secret(
                new_secret := v_raw_key,
                new_name := 'INTERNAL_SERVICE_ROLE_KEY',
                new_description := 'Chave de servico interna criptografada para disparos pg_net e pg_cron'
            );
        ELSE
            PERFORM vault.update_secret(
                secret_id := v_existing_id,
                new_secret := v_raw_key,
                new_name := 'INTERNAL_SERVICE_ROLE_KEY',
                new_description := 'Chave de servico interna criptografada para disparos pg_net e pg_cron'
            );
        END IF;
    END IF;
END $$;

-- 2. HARDENING DA RPC DE AVALIAÇÃO ADMINISTRATIVA (ADMIN_REVIEW_BETA_APPLICATION)
-- Elimina expressamente current_user = 'postgres' como identificação do chamador.
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
    -- Verificação Estrita de Privilégio Administrativo (Zero confiança em current_user)
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' THEN
        v_is_admin := true;
    ELSIF auth.uid() IS NOT NULL THEN
        SELECT (u.role IN ('admin', 'super_admin', 'institution_admin')) INTO v_is_admin
        FROM public.users u
        WHERE u.id = auth.uid();
    ELSE
        v_is_admin := false;
    END IF;

    IF v_is_admin IS NOT TRUE THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'UNAUTHORIZED', 
            'message', 'Acesso restrito a administradores autorizados.'
        );
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

-- 3. HARDENING DA RPC DE RESERVA DA FILA DE E-MAILS (CLAIM_NEXT_BETA_EMAIL_NOTIFICATION)
-- Restringe estritamente a execução para chamadas com papel service_role.
DROP FUNCTION IF EXISTS public.claim_next_beta_email_notification();

CREATE OR REPLACE FUNCTION public.claim_next_beta_email_notification()
RETURNS TABLE (
    notification_id UUID,
    app_id UUID,
    recipient_email TEXT,
    subject TEXT,
    event_type TEXT,
    claimed_attempts INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_target_id UUID;
BEGIN
    -- Verificação estrita de autorização exclusiva para serviço interno
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) <> 'service_role' THEN
        RAISE EXCEPTION 'Acesso negado: claim_next_beta_email_notification e restrita ao servico interno autorizado.'
            USING ERRCODE = '42501';
    END IF;

    -- Seleciona a próxima notificação elegível com lock atômico
    SELECT q.id INTO v_target_id
    FROM public.beta_email_notifications q
    WHERE q.status = 'queued'
       OR (q.status = 'failed' AND q.attempts < q.max_attempts AND q.last_attempt_at < timezone('utc'::text, now()) - (q.attempts * INTERVAL '2 minutes'))
       OR (q.status = 'processing' AND q.last_attempt_at < timezone('utc'::text, now()) - INTERVAL '10 minutes')
    ORDER BY q.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1;

    IF v_target_id IS NULL THEN
        RETURN;
    END IF;

    -- Atualiza atomicamente para 'processing'
    UPDATE public.beta_email_notifications b
    SET status = 'processing',
        attempts = b.attempts + 1,
        last_attempt_at = timezone('utc'::text, now())
    WHERE b.id = v_target_id;

    RETURN QUERY
    SELECT n.id, n.application_id, n.recipient_email, n.subject, n.event_type, n.attempts
    FROM public.beta_email_notifications n
    WHERE n.id = v_target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_next_beta_email_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_beta_email_notification() TO service_role;

-- 4. HARDENING DA RPC PÚBLICA DE SUBMISSÃO (SUBMIT_BETA_APPLICATION)
-- Remove o parâmetro p_is_internal_test, bloqueia pré-lançamento para usuários públicos
-- e consome o segredo de autenticação de disparos do Supabase Vault.
DROP FUNCTION IF EXISTS public.submit_beta_application(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, text, text, text, boolean);
DROP FUNCTION IF EXISTS public.submit_beta_application(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, text, text, text);

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

    -- 9. INSERÇÃO NA FILA TRANSACIONAL DE E-MAIL (OUTBOX) COM IDEMPOTÊNCIA
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

    -- 12. EVENTO DE AUDITORIA E TELEMETRIA
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

-- 5. ATUALIZAÇÃO DO CRON JOB COM SEGREDO DO SUPABASE VAULT
DO $cron_setup$
BEGIN
    PERFORM cron.unschedule('process-beta-email-notifications');
EXCEPTION WHEN OTHERS THEN
END;
$cron_setup$;

SELECT cron.schedule(
    'process-beta-email-notifications',
    '* * * * *',
    $$
    DO $inner$
    DECLARE
        v_pending_count INT;
        v_service_key TEXT;
    BEGIN
        SELECT COUNT(*) INTO v_pending_count
        FROM public.beta_email_notifications
        WHERE status = 'queued'
           OR (status = 'failed' AND attempts < max_attempts AND last_attempt_at < timezone('utc'::text, now()) - (attempts * INTERVAL '2 minutes'))
           OR (status = 'processing' AND last_attempt_at < timezone('utc'::text, now()) - INTERVAL '10 minutes');

        IF v_pending_count > 0 THEN
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
                    body := jsonb_build_object('trigger', 'pg_cron_periodic_sweep')
                );
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
    END;
    $inner$;
    $$
);

-- 6. REMOÇÃO DEFINITIVA DO SEGREDO DE PLATFORM_SYSTEM_SETTINGS E BLINDAGEM DE POLÍTICAS
DELETE FROM public.platform_system_settings WHERE setting_key = 'supabase_service_role_key';

ALTER TABLE public.platform_system_settings
DROP CONSTRAINT IF EXISTS check_platform_settings_no_service_keys;

ALTER TABLE public.platform_system_settings
ADD CONSTRAINT check_platform_settings_no_service_keys 
CHECK (setting_key NOT ILIKE '%service_role%' AND setting_key NOT ILIKE '%secret%' AND setting_key NOT ILIKE '%token%');

-- Atualização da política RLS de platform_system_settings:
-- Apenas admin e super_admin podem visualizar; institution_admin só visualiza chaves não sensíveis
DROP POLICY IF EXISTS "Admins can view system settings" ON public.platform_system_settings;
CREATE POLICY "Admins can view system settings"
ON public.platform_system_settings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (
            u.role IN ('admin', 'super_admin')
            OR (u.role = 'institution_admin' AND is_sensitive = false)
        )
    )
);
