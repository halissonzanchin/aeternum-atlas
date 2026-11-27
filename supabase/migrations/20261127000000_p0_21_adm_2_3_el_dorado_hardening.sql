-- ==============================================================================
-- AETERNUM ATLAS — MISSÃO P0.21-ADM.2.3-R1
-- OPERAÇÃO EL DORADO: HARDENING DE AUTORIZAÇÃO, RLS & CAPACIDADE TRANSACIONAL
-- ==============================================================================

-- 1. HARDENING DE RLS NA TABELA BETA_APPLICATIONS
-- Revoga atualização direta de clientes autenticados para forçar o uso da RPC auditada
DROP POLICY IF EXISTS "Admins can update beta applications" ON public.beta_applications;
REVOKE UPDATE ON public.beta_applications FROM authenticated;

-- Restringe leitura de beta_applications por escopo institucional
DROP POLICY IF EXISTS "Admins can view all beta applications" ON public.beta_applications;
DROP POLICY IF EXISTS "Platform admins and institution admins can view authorized beta applications" ON public.beta_applications;

CREATE POLICY "Platform admins and institution admins can view authorized beta applications"
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
                -- Admin institucional só pode visualizar candidatos da sua própria instituição
                u.role = 'institution_admin'
                AND u.institution_id IS NOT NULL
                AND (
                    -- Se a candidatura já foi vinculada a um discente da instituição
                    EXISTS (
                        SELECT 1 FROM public.users stu
                        WHERE stu.id = public.beta_applications.user_id
                        AND stu.institution_id = u.institution_id
                    )
                    OR (
                        -- Ou se a instituição declarada coincide com a instituição do admin
                        EXISTS (
                            SELECT 1 FROM public.institutions inst
                            WHERE inst.id = u.institution_id
                            AND lower(trim(inst.name)) = lower(trim(public.beta_applications.institution_name))
                        )
                    )
                )
            )
        )
    )
);

-- 2. HARDENING DA RPC ADMIN_REVIEW_BETA_APPLICATION (CAPACIDADE & CONCORRÊNCIA)
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
    -- 1. Verificação Estrita de Privilégio Administrativo
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
    END IF;

    -- Validar novo status permitido
    IF p_new_status NOT IN ('pending', 'under_review', 'approved', 'waitlisted', 'invited', 'activated', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false, 
            'code', 'INVALID_STATUS', 
            'message', 'Status administrativo inválido.'
        );
    END IF;

    -- 2. BLOQUEIO DE LINHA EXCLUSIVO (ROW LOCK) para evitar mutações concorrentes na mesma candidatura
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

    -- Verificação institucional para institution_admin
    IF NOT v_is_authorized AND v_caller_role = 'institution_admin' THEN
        IF v_caller_inst_id IS NOT NULL AND (
            (v_current_app.user_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.users stu WHERE stu.id = v_current_app.user_id AND stu.institution_id = v_caller_inst_id
            ))
            OR EXISTS (
                SELECT 1 FROM public.institutions inst WHERE inst.id = v_caller_inst_id AND lower(trim(inst.name)) = lower(trim(v_current_app.institution_name))
            )
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

    -- 3. BLOQUEIO TRANSACIONAL EXCLUSIVO ADVISORY no lote alvo
    PERFORM pg_advisory_xact_lock(hashtext('beta_capacity_' || v_target_batch));

    -- 4. CONTROLE RÍGIDO DE CAPACIDADE DE VAGAS RESERVADAS
    -- Vagas reservadas = approved, invited e activated (incluindo user_id vinculado)
    -- Dispara se o novo status reserva vaga E (o status anterior não reservava OU houve mudança de lote)
    IF p_new_status IN ('approved', 'invited', 'activated') 
       AND (v_current_app.status NOT IN ('approved', 'invited', 'activated') 
            OR v_current_app.batch IS DISTINCT FROM v_target_batch) THEN

        SELECT COUNT(*) INTO v_approved_count
        FROM public.beta_applications
        WHERE (status IN ('approved', 'invited', 'activated') OR user_id IS NOT NULL)
          AND batch = v_target_batch
          AND batch != 'synthetic_test'
          AND COALESCE(source_origin, '') NOT ILIKE '%synthetic%';

        IF v_target_batch = 'batch_1_30' AND v_approved_count >= 30 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 1 (30 vagas homologadas) foi atingida. Expansão para lotes posteriores requer homologação operacional.'
            );
        ELSIF v_target_batch = 'batch_2_50' AND v_approved_count >= 50 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 2 (50 vagas homologadas) foi atingida. Expansão para Lote 3 requer deliberação executiva.'
            );
        ELSIF v_target_batch = 'batch_3_100' AND v_approved_count >= 100 THEN
            RETURN jsonb_build_object(
                'success', false,
                'code', 'CAPACITY_EXCEEDED',
                'message', 'A capacidade máxima do Lote 3 (100 vagas) foi atingida.'
            );
        END IF;
    END IF;

    -- 5. Anexar ao histórico auditado de decisões
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
    -- Verificação de autorização administrativa
    IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) = 'service_role' THEN
        v_caller_role := 'service_role';
    ELSIF auth.uid() IS NOT NULL THEN
        SELECT u.role INTO v_caller_role
        FROM public.users u
        WHERE u.id = auth.uid();
    ELSE
        v_caller_role := NULL;
    END IF;

    IF v_caller_role NOT IN ('super_admin', 'admin', 'institution_admin', 'service_role') THEN
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
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'under_review'),
        COUNT(*) FILTER (WHERE status = 'approved'),
        COUNT(*) FILTER (WHERE status = 'waitlisted'),
        COUNT(*) FILTER (WHERE status = 'invited'),
        COUNT(*) FILTER (WHERE status = 'activated' OR user_id IS NOT NULL),
        COUNT(*) FILTER (WHERE status = 'rejected'),
        COUNT(*) FILTER (WHERE (status IN ('approved', 'invited', 'activated') OR user_id IS NOT NULL) AND batch = 'batch_1_30')
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

    -- Métricas de notificações
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
        FROM public.beta_email_notifications;
    EXCEPTION WHEN OTHERS THEN
        v_notif_total := 0;
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
        'notifications', jsonb_build_object(
            'total', v_notif_total,
            'sent', v_notif_sent,
            'failed', v_notif_failed,
            'queued', v_notif_queued
        ),
        'is_pending_certification', false
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_beta_operational_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_beta_operational_summary() TO authenticated, service_role;
