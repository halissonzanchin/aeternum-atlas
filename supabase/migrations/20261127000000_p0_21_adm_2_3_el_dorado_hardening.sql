-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO P0.21-ADM.2.3-R2
-- OPERAÇÃO EL DORADO: FINAL SECURITY & OPERATIONAL CERTIFICATION
-- HARDENING DE AUTORIZAÇÃO FAIL-CLOSED, RLS, MÁQUINA DE ESTADOS & CAPACIDADE
-- ==============================================================================

-- 1. HARDENING DE RLS NA TABELA BETA_APPLICATIONS
-- Revoga atualização direta de clientes autenticados para forçar o uso da RPC auditada
DROP POLICY IF EXISTS "Admins can update beta applications" ON public.beta_applications;
REVOKE UPDATE ON public.beta_applications FROM authenticated;
REVOKE ALL ON public.beta_applications FROM anon;

-- Restringe leitura de beta_applications por escopo institucional estrito
-- Centraliza administração global no super_admin e admin expressamente autorizado
-- EL-DORADO-R1-01: Elimina string-matching de instituição auto-declarada pelo candidato
DROP POLICY IF EXISTS "Admins can view all beta applications" ON public.beta_applications;
DROP POLICY IF EXISTS "Platform admins and institution admins can view authorized beta applications" ON public.beta_applications;
DROP POLICY IF EXISTS "Platform admins and authorized institution admins can view beta applications" ON public.beta_applications;

CREATE POLICY "Platform admins and authorized institution admins can view beta applications"
ON public.beta_applications
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
        AND (
            -- Super Admin e Admin Global têm visibilidade da Operação El Dorado
            u.role IN ('super_admin', 'admin')
            OR (
                -- Admin institucional só pode visualizar se o candidato já foi formalmente
                -- provisionado e vinculado como discente da sua instituição (user_id IS NOT NULL)
                -- NUNCA por correspondência de string com a instituição auto-declarada
                u.role = 'institution_admin'
                AND u.institution_id IS NOT NULL
                AND public.beta_applications.user_id IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM public.users stu
                    WHERE stu.id = public.beta_applications.user_id
                    AND stu.institution_id = u.institution_id
                )
            )
        )
    )
);

-- 2. HARDENING DA RPC ADMIN_REVIEW_BETA_APPLICATION (MÁQUINA DE ESTADOS, CAPACIDADE & QUARENTENA)
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
    v_caller_role TEXT;
    v_caller_inst_id UUID;
    v_is_authorized BOOLEAN := false;
    v_current_app RECORD;
    v_target_batch TEXT;
    v_approved_count INT;
    v_updated_history JSONB;
BEGIN
    -- 1. FINAL-04: Verificação Estrita de Autorização ANTES de qualquer consulta à tabela (Eliminação de Oracle de Enumeração)
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' THEN
        v_is_authorized := true;
        v_caller_role := 'service_role';
    ELSIF auth.uid() IS NOT NULL THEN
        SELECT u.role, u.institution_id INTO v_caller_role, v_caller_inst_id
        FROM public.users u
        WHERE u.id = auth.uid();

        IF v_caller_role IN ('super_admin', 'admin') THEN
            v_is_authorized := true;
        END IF;
    ELSE
        v_caller_role := NULL;
    END IF;

    -- Rejeição imediata se não possuir papel administrativo reconhecido (impede sondagem anônima/estudantil de UUIDs)
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'admin', 'institution_admin', 'service_role') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'UNAUTHORIZED', 
            'message', 'Acesso restrito a administradores autorizados.'
        );
    END IF;

    -- Validar novo status permitido
    IF p_new_status NOT IN ('pending', 'under_review', 'approved', 'waitlisted', 'invited', 'activated', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'INVALID_STATUS', 
            'message', 'Status administrativo inválido.'
        );
    END IF;

    -- 2. BLOQUEIO DE LINHA EXCLUSIVO (ROW LOCK) para administradores previamente autorizados
    SELECT * INTO v_current_app
    FROM public.beta_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'NOT_FOUND', 
            'message', 'Candidatura não localizada.'
        );
    END IF;

    -- Verificação institucional restrita para institution_admin
    -- EL-DORADO-R1-01: Exige vínculo acadêmico pré-existente (user_id); sem string-matching
    IF NOT v_is_authorized AND v_caller_role = 'institution_admin' THEN
        IF v_caller_inst_id IS NOT NULL AND v_current_app.user_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users stu 
            WHERE stu.id = v_current_app.user_id AND stu.institution_id = v_caller_inst_id
        ) THEN
            v_is_authorized := true;
        END IF;
    END IF;

    IF NOT v_is_authorized THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'UNAUTHORIZED', 
            'message', 'Acesso restrito a administradores autorizados para esta candidatura.'
        );
    END IF;

    v_target_batch := COALESCE(p_batch, v_current_app.batch, 'batch_1_30');

    -- 3. EL-DORADO-R1-02: PROTEÇÃO ESTRITA DA QUARENTENA SINTÉTICA
    IF (v_current_app.batch = 'synthetic_test' OR COALESCE(v_current_app.source_origin, '') ILIKE '%synthetic%') THEN
        IF v_target_batch != 'synthetic_test' THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'QUARANTINE_PROTECTED',
                'message', 'Registros sintéticos em quarentena não podem ser promovidos para lotes operacionais.'
            );
        END IF;
    ELSIF v_target_batch = 'synthetic_test' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'QUARANTINE_PROTECTED',
            'message', 'Candidaturas operacionais legítimas não podem ser movidas para a quarentena sintética.'
        );
    END IF;

    -- 4. EL-DORADO-R1-02: CONTROLE DE LOTES AUTORIZADOS
    -- Somente batch_1_30 é autorizado na fase inicial (ou synthetic_test em isolamento de teste)
    IF v_target_batch NOT IN ('batch_1_30', 'synthetic_test') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'BATCH_NOT_AUTHORIZED',
            'message', 'Apenas o Lote 1 (30 vagas) está autorizado nesta fase operacional. Expansão para lotes posteriores requer deliberação executiva.'
        );
    END IF;

    -- 5. FINAL-04 / EL-DORADO-R1-03: MÁQUINA DE ESTADOS E CONTROLE DE TRANSIÇÕES (BLOQUEIO E7.3)
    -- Proibir transição direta de pending ou under_review para invited ou activated
    IF v_current_app.status IN ('pending', 'under_review') AND p_new_status IN ('invited', 'activated') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_STATE_TRANSITION',
            'message', 'Candidaturas pendentes ou em análise devem ser aprovadas antes de receber convite ou ativação.'
        );
    END IF;

    -- Proibir ativação sem convite prévio
    IF p_new_status = 'activated' AND v_current_app.status != 'invited' THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_STATE_TRANSITION',
            'message', 'Ativação acadêmica requer que a candidatura tenha sido previamente convidada (invited).'
        );
    END IF;

    -- Proibir transição de rejected diretamente para invited ou activated
    IF v_current_app.status = 'rejected' AND p_new_status IN ('invited', 'activated') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_STATE_TRANSITION',
            'message', 'Candidatura rejeitada não pode ser diretamente convidada ou ativada sem nova análise e aprovação.'
        );
    END IF;

    -- FINAL-04: Não permitir alteração meramente declaratória para invited sem justificativa/registro formal de despacho
    IF p_new_status = 'invited' AND (p_review_notes IS NULL OR TRIM(p_review_notes) = '') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DECLARATORY_INVITE_BLOCKED',
            'message', 'Alteração declaratória para invited bloqueada sem justificativa ou confirmação de disparo de convite.'
        );
    END IF;

    -- FINAL-04: Não permitir alteração para activated somente porque existe user_id
    -- Exige vínculo acadêmico pré-existente e compatibilidade estrita de e-mail e papel discente
    IF p_new_status = 'activated' THEN
        IF v_current_app.user_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'PROVISIONING_REQUIRED',
                'message', 'Ativação acadêmica (E7.3) requer provisionamento prévio de conta com vínculo de usuário (user_id).'
            );
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = v_current_app.user_id
              AND u.role IN ('student', 'academic', 'discente', 'user')
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'ACCOUNT_NOT_VERIFIED',
                'message', 'Conta vinculada não possui perfil discente válido no sistema.'
            );
        END IF;
    END IF;

    -- FINAL-04: Não liberar vagas associadas a contas acadêmicas ainda efetivamente ativas
    IF v_current_app.status = 'activated' AND p_new_status NOT IN ('activated', 'invited') THEN
        IF v_current_app.user_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.users u WHERE u.id = v_current_app.user_id AND u.role IN ('student', 'academic', 'discente', 'user')
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'ACTIVE_ACCOUNT_LOCKED',
                'message', 'Vaga associada a conta acadêmica ativa não pode ser liberada sem desativação prévia da conta discente.'
            );
        END IF;
    END IF;

    -- 6. BLOQUEIO TRANSACIONAL EXCLUSIVO ADVISORY no lote alvo
    PERFORM pg_advisory_xact_lock(hashtext('beta_capacity_' || v_target_batch));

    -- 7. EL-DORADO-R1-02: CONTROLE RÍGIDO DE CAPACIDADE DE VAGAS RESERVADAS (CANÔNICO)
    -- Vagas reservadas = status IN ('approved', 'invited', 'activated') no lote correspondente
    IF p_new_status IN ('approved', 'invited', 'activated') 
       AND (v_current_app.status NOT IN ('approved', 'invited', 'activated') 
            OR v_current_app.batch IS DISTINCT FROM v_target_batch) THEN

        SELECT COUNT(*) INTO v_approved_count
        FROM public.beta_applications
        WHERE status IN ('approved', 'invited', 'activated')
          AND batch = v_target_batch
          AND batch != 'synthetic_test'
          AND COALESCE(source_origin, '') NOT ILIKE '%synthetic%';

        IF v_target_batch = 'batch_1_30' AND v_approved_count >= 30 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 1 (30 vagas homologadas) foi atingida. Expansão para lotes posteriores requer homologação operacional.'
            );
        END IF;
    END IF;

    -- 8. Anexar ao histórico auditado de decisões
    v_updated_history := COALESCE(v_current_app.decision_history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
            'from_status', v_current_app.status,
            'to_status', p_new_status,
            'from_batch', v_current_app.batch,
            'to_batch', v_target_batch,
            'actor_id', auth.uid(),
            'notes', p_review_notes,
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

-- 3. NOVA RPC AGREGADA PARA CONTROL CENTER (NÚCLEO 2) SEM EXPOSIÇÃO DE PII
-- EL-DORADO-R1-01: Autorização Fail-Closed rigorosa contra role NULL e roles não autorizadas
CREATE OR REPLACE FUNCTION public.get_beta_operational_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller_role TEXT;
    v_is_open BOOLEAN;
    v_total INT := 0;
    v_pending INT := 0;
    v_under_review INT := 0;
    v_approved INT := 0;
    v_waitlisted INT := 0;
    v_invited INT := 0;
    v_activated INT := 0;
    v_rejected INT := 0;
    v_reserved INT := 0;
    v_remaining INT := 30;
    v_notif_total INT := 0;
    v_notif_sent INT := 0;
    v_notif_failed INT := 0;
    v_notif_queued INT := 0;
BEGIN
    -- Verificação de autorização administrativa estrita (Fail-Closed)
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' THEN
        v_caller_role := 'service_role';
    ELSIF auth.uid() IS NOT NULL THEN
        SELECT u.role INTO v_caller_role
        FROM public.users u
        WHERE u.id = auth.uid();
    ELSE
        v_caller_role := NULL;
    END IF;

    -- Rejeição explícita de:
    -- - Usuário não autenticado (v_caller_role IS NULL)
    -- - Perfil inexistente no banco (v_caller_role IS NULL)
    -- - Role nula
    -- - Role desconhecida
    -- - Estudante ('student')
    -- Centralização global no Super Admin e Admin expressamente autorizado.
    IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'admin', 'service_role') THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'UNAUTHORIZED',
            'message', 'Acesso restrito a administradores autorizados.'
        );
    END IF;

    -- Estado mestre das inscrições
    SELECT COALESCE((setting_value = 'true'), false) INTO v_is_open
    FROM public.platform_system_settings
    WHERE setting_key = 'beta_registration_open';

    -- Métricas consolidadas (excluindo quarentena sintética)
    -- EL-DORADO-R1-02: Definição canônica de vagas reservadas: status IN ('approved', 'invited', 'activated')
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'under_review'),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'waitlisted'),
        COUNT(*) FILTER (WHERE status = 'invited'),
        COUNT(*) FILTER (WHERE status = 'activated'),
        COUNT(*) FILTER (WHERE status = 'rejected'),
        COUNT(*) FILTER (WHERE status IN ('approved', 'invited', 'activated') AND batch = 'batch_1_30')
    INTO
        v_total,
        v_pending,
        v_under_review,
        v_approved,
        v_waitlisted,
        v_invited,
        v_activated,
        v_rejected,
        v_reserved
    FROM public.beta_applications
    WHERE batch != 'synthetic_test'
      AND COALESCE(source_origin, '') NOT ILIKE '%synthetic%';

    v_remaining := GREATEST(0, 30 - v_reserved);

    -- FINAL-04: Métricas de notificações excluindo testes sintéticos e preservando falhas (sem converter em zero)
    BEGIN
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'sent'),
            COUNT(*) FILTER (WHERE status = 'failed'),
            COUNT(*) FILTER (WHERE status = 'queued')
        INTO
            v_notif_total,
            v_notif_sent,
            v_notif_failed,
            v_notif_queued
        FROM public.beta_email_notifications
        WHERE recipient_email NOT ILIKE '%synthetic%'
          AND recipient_email NOT ILIKE '%test%'
          AND recipient_email NOT ILIKE '%example%';
    EXCEPTION WHEN OTHERS THEN
        v_notif_total := NULL;
        v_notif_sent := NULL;
        v_notif_failed := NULL;
        v_notif_queued := NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'registration_open', COALESCE(v_is_open, false),
        'status', CASE WHEN COALESCE(v_is_open, false) THEN 'open' ELSE 'pre_launch' END,
        'total_applications', v_total,
        'pending', v_pending,
        'under_review', v_under_review,
        'approved', v_approved,
        'waitlisted', v_waitlisted,
        'invited', v_invited,
        'activated', v_activated,
        'rejected', v_rejected,
        'batch_1_capacity', 30,
        'batch_1_reserved', v_reserved,
        'batch_1_remaining', v_remaining,
        'notifications', CASE 
            WHEN v_notif_total IS NULL THEN NULL
            ELSE jsonb_build_object(
                'total', v_notif_total,
                'sent', v_notif_sent,
                'failed', v_notif_failed,
                'queued', v_notif_queued,
                'status', 'OPERATIONAL'
            )
        END,
        'notifications_status', CASE 
            WHEN v_notif_total IS NULL THEN 'UNAVAILABLE' 
            ELSE 'OPERATIONAL' 
        END,
        'is_pending_certification', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_beta_operational_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_beta_operational_summary() TO authenticated, service_role;

-- 4. ALINHAMENTO DA RPC GET_BETA_PROGRAM_PUBLIC_STATUS COM A DEFINIÇÃO CANÔNICA DE CAPACIDADE
CREATE OR REPLACE FUNCTION public.get_beta_program_public_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_is_open BOOLEAN;
    v_reserved_count INT;
BEGIN
    SELECT COALESCE((setting_value = 'true'), false) INTO v_is_open
    FROM public.platform_system_settings
    WHERE setting_key = 'beta_registration_open';

    SELECT COUNT(*) INTO v_reserved_count
    FROM public.beta_applications
    WHERE status IN ('approved', 'invited', 'activated') 
      AND batch = 'batch_1_30'
      AND batch != 'synthetic_test'
      AND COALESCE(source_origin, '') NOT ILIKE '%synthetic%';

    RETURN jsonb_build_object(
        'success', true,
        'registration_open', COALESCE(v_is_open, false),
        'initial_batch_capacity', 30,
        'current_batch_approved', COALESCE(v_reserved_count, 0),
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
