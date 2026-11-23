if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import { runSupabaseSql, getServiceRoleKey } from "./supabase_admin_helper.mjs";

export async function setupMasterSchema() {
  console.log("=== APLICANDO SCHEMA P0.21-MASTER NO SUPABASE ===");

  const serviceRoleKey = await getServiceRoleKey();

  const migrationSql = `
-- ==============================================================================
-- AETERNUM ATLAS — P0.21-MASTER: OPERAÇÃO EL DORADO & AUTENTICAÇÃO CRIPTOGRÁFICA
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES DE SISTEMA DO AMBIENTE (PLATFORM SETTINGS)
CREATE TABLE IF NOT EXISTS public.platform_system_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.platform_system_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_system_settings FROM PUBLIC, anon;
GRANT SELECT ON public.platform_system_settings TO authenticated;
GRANT ALL ON public.platform_system_settings TO service_role;

DROP POLICY IF EXISTS "Admins can view system settings" ON public.platform_system_settings;
CREATE POLICY "Admins can view system settings"
ON public.platform_system_settings
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND u.role IN ('admin', 'super_admin', 'institution_admin')
    )
);

-- Inserir / garantir configurações essenciais (Negado por padrão: pré-lançamento)
INSERT INTO public.platform_system_settings (setting_key, setting_value, description, is_sensitive)
VALUES 
    ('beta_registration_open', 'false', 'Controla a abertura pública das inscrições da Operação El Dorado', false),
    ('beta_capacity_batch_1', '30', 'Capacidade máxima homologada para a 1ª turma', false),
    ('server_rate_limit_salt', encode(extensions.gen_random_bytes(32), 'hex'), 'Salt criptográfico de IP do servidor', true),
    ('supabase_service_role_key', '${serviceRoleKey}', 'Chave interna para triggers do banco e cron', true)
ON CONFLICT (setting_key) DO UPDATE 
SET setting_value = EXCLUDED.setting_value,
    updated_at = timezone('utc'::text, now())
WHERE public.platform_system_settings.setting_key = 'supabase_service_role_key';

-- 2. RPC PÚBLICA PARA STATUS DE PRÉ-LANÇAMENTO DO PROGRAMA BETA
CREATE OR REPLACE FUNCTION public.get_beta_program_public_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_is_open BOOLEAN;
    v_approved_count INT;
BEGIN
    SELECT COALESCE((setting_value = 'true'), false) INTO v_is_open
    FROM public.platform_system_settings
    WHERE setting_key = 'beta_registration_open';

    SELECT COUNT(*) INTO v_approved_count
    FROM public.beta_applications
    WHERE status IN ('approved', 'invited') AND batch = 'batch_1_30';

    RETURN jsonb_build_object(
        'success', true,
        'registration_open', COALESCE(v_is_open, false),
        'initial_batch_capacity', 30,
        'current_batch_approved', COALESCE(v_approved_count, 0),
        'opening_window', 'Primeira semana de dezembro de 2026',
        'status', CASE WHEN COALESCE(v_is_open, false) THEN 'open' ELSE 'pre_launch' END,
        'message', CASE 
            WHEN COALESCE(v_is_open, false) THEN 'Inscrições abertas para a 1ª Turma do Programa Beta.'
            ELSE 'Operação El Dorado: Inscrições oficiais serão abertas na primeira semana de dezembro de 2026.'
        END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_beta_program_public_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_beta_program_public_status() TO anon, authenticated, service_role;

-- 3. RPC PARA RESERVA ATÔMICA DA FILA DE E-MAILS (FOR UPDATE SKIP LOCKED)
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

REVOKE ALL ON FUNCTION public.claim_next_beta_email_notification() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_next_beta_email_notification() TO authenticated, service_role;

-- 4. RPC SUBMIT_BETA_APPLICATION COM CONTROLE DE PRÉ-LANÇAMENTO, RATE LIMIT E FILA ATÔMICA
DROP FUNCTION IF EXISTS public.submit_beta_application(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, text, text, text);
DROP FUNCTION IF EXISTS public.submit_beta_application(text, text, text, text, text, text, text, text, text, text, text, boolean, boolean, boolean, text, text, text, boolean);
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
    p_ip_hash TEXT DEFAULT NULL, -- Ignorado: IP é sempre extraído pelo servidor
    p_user_agent TEXT DEFAULT NULL,
    p_is_internal_test BOOLEAN DEFAULT false
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
BEGIN
    -- Sanitização e normalização estrita
    v_clean_email := lower(trim(p_email));
    v_clean_name := trim(p_full_name);
    v_clean_inst := trim(p_institution_name);
    v_clean_course := trim(p_course);
    v_clean_term := trim(p_academic_term);
    v_clean_motivation := trim(p_motivation);

    -- Determinar se é chamada administrativa ou teste interno autorizado
    IF (current_user IN ('postgres', 'supabase_admin') OR 
        COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' OR
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'super_admin'))) THEN
        v_is_privileged_caller := true;
    END IF;

    -- 1. CONTROLE DE ABERTURA SERVER-SIDE (PRÉ-LANÇAMENTO)
    SELECT COALESCE((setting_value = 'true'), false) INTO v_is_registration_open
    FROM public.platform_system_settings
    WHERE setting_key = 'beta_registration_open';

    IF NOT v_is_registration_open AND NOT v_is_privileged_caller AND NOT COALESCE(p_is_internal_test, false) THEN
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
        -- Quando rodando sem proxy/cabeçalho, gera identificador baseado no IP de conexão PostgreSQL
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

    -- 6. PROTEÇÃO CONTRA ENUMERAÇÃO DE E-MAILS (ANTI-ENUMERATION)
    SELECT id, protocol_number INTO v_existing_id, v_protocol
    FROM public.beta_applications
    WHERE lower(trim(email)) = v_clean_email;

    IF v_existing_id IS NOT NULL THEN
        -- Retorna confirmação segura sem vazar dados cadastrais privados
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

    -- 10. DISPARO ASSÍNCRONO NÃO-BLOQUEANTE VIA PG_NET
    BEGIN
        PERFORM net.http_post(
            url := 'https://hyivyrietgjdazgizafp.supabase.co/functions/v1/send-beta-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT setting_value FROM public.platform_system_settings WHERE setting_key = 'supabase_service_role_key')
            ),
            body := jsonb_build_object(
                'application_id', v_app_id,
                'trigger', 'pg_net_async_dispatch'
            )
        );
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

REVOKE ALL ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_beta_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, TEXT, TEXT, BOOLEAN) TO anon, authenticated, service_role;

-- 5. CRON JOB DE DISPARO ASSÍNCRONO DA FILA DE E-MAIL (EVERY 1 MINUTE)
DO $cron_setup$
BEGIN
    -- Remover cron job anterior se existir
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
            SELECT setting_value INTO v_service_key
            FROM public.platform_system_settings
            WHERE setting_key = 'supabase_service_role_key';

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
`;

  const res = await runSupabaseSql(migrationSql);
  console.log("Schema P0.21-MASTER aplicado com sucesso!");
  return res;
}

setupMasterSchema().catch(err => {
  console.error("Erro ao aplicar schema master:", err);
  process.exit(1);
});
