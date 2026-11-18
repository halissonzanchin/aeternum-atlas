-- ==============================================================================
-- AETERNUM ATLAS — P0.14: CENTRAL INSTITUCIONAL DE NOTIFICAÇÕES
-- Migration: 20261118000000_p0_14_institutional_notifications.sql
-- Description: Central Institucional de Notificações e Atualizações Programadas.
--              - Modelagem completa de avisos de manutenção, melhorias e comunicados.
--              - RLS granular com isolamento estrito entre administradores e estudantes.
--              - Rastreamento de leitura individual por estudante (user_notification_reads).
--              - Trilha de auditoria administrativa permanente (notification_audit_log).
--              - Filtros por público-alvo e instituição com isolamento multi-tenant real.
--              - Validação de Session Guard (FIRST SESSION WINS) e visibilidade nas RPCs.
--              - Armazenamento em UTC com suporte a fuso horário administrativo.
-- Pre-conditions: 20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql applied.
-- Rollback Plan: supabase/rollback-plans/rollback_20261118000000_p0_14_institutional_notifications.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. TABELA PRINCIPAL: institutional_notifications
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institutional_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL CHECK (char_length(trim(title)) >= 3),
    message text NOT NULL CHECK (char_length(trim(message)) >= 10),
    type text NOT NULL CHECK (type IN (
        'scheduled_maintenance',
        'maintenance_in_progress',
        'maintenance_completed',
        'maintenance_postponed',
        'maintenance_cancelled',
        'platform_improvement',
        'institutional_announcement'
    )),
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN (
        'low',
        'normal',
        'high',
        'critical'
    )),
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft',
        'scheduled',
        'published',
        'in_progress',
        'completed',
        'postponed',
        'cancelled'
    )),
    target_audience text NOT NULL DEFAULT 'all' CHECK (target_audience IN (
        'all',
        'students',
        'teachers',
        'institution_admins',
        'specific_institution'
    )),
    institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
    affected_resources jsonb NOT NULL DEFAULT '[]'::jsonb,
    scheduled_start_at timestamptz,
    scheduled_end_at timestamptz,
    published_at timestamptz,
    timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_scheduled_window CHECK (
        scheduled_end_at IS NULL
        OR scheduled_start_at IS NULL
        OR scheduled_end_at >= scheduled_start_at
    ),
    CONSTRAINT chk_institution_audience CHECK (
        target_audience <> 'specific_institution'
        OR institution_id IS NOT NULL
    )
);

-- Índices otimizados para consulta frequente do estudante e filtros administrativos
CREATE INDEX IF NOT EXISTS idx_inst_notif_student_feed
    ON public.institutional_notifications (status, published_at DESC)
    WHERE status IN ('published', 'in_progress', 'completed', 'postponed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_inst_notif_audience
    ON public.institutional_notifications (target_audience, institution_id);

CREATE INDEX IF NOT EXISTS idx_inst_notif_type
    ON public.institutional_notifications (type, status);

CREATE INDEX IF NOT EXISTS idx_inst_notif_scheduled
    ON public.institutional_notifications (scheduled_start_at, scheduled_end_at)
    WHERE scheduled_start_at IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 2. TABELA DE LEITURA POR ESTUDANTE: user_notification_reads
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_id uuid NOT NULL REFERENCES public.institutional_notifications(id) ON DELETE CASCADE,
    read_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_reads_user
    ON public.user_notification_reads (user_id, read_at DESC);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE AUDITORIA ADMINISTRATIVA: notification_audit_log
--    ON DELETE SET NULL: preserva a integridade do histórico mesmo se um comunicado for excluído.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id uuid REFERENCES public.institutional_notifications(id) ON DELETE SET NULL,
    notification_title text,
    action text NOT NULL CHECK (action IN (
        'created',
        'updated',
        'scheduled',
        'published',
        'started',
        'completed',
        'postponed',
        'cancelled',
        'deleted'
    )),
    actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    actor_role text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_audit_log_notif
    ON public.notification_audit_log (notification_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. FUNÇÕES AUXILIARES DE SEGURANÇA E ACESSO
-- ------------------------------------------------------------------------------

-- Verifica se o usuário atual possui privilégio administrativo
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_role text;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN true;
    END IF;

    IF v_uid IS NULL THEN
        RETURN false;
    END IF;

    SELECT u.role INTO v_role
    FROM public.users u
    WHERE u.id = v_uid AND lower(u.status) IN ('active', 'ativo');

    RETURN v_role IN ('super_admin', 'rector', 'admin', 'institution_admin');
END;
$$;

-- Verifica se o usuário atual é superadministrador da plataforma
CREATE OR REPLACE FUNCTION public.is_super_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_role text;
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN true;
    END IF;

    IF v_uid IS NULL THEN
        RETURN false;
    END IF;

    SELECT u.role INTO v_role
    FROM public.users u
    WHERE u.id = v_uid AND lower(u.status) IN ('active', 'ativo');

    RETURN v_role IN ('super_admin', 'rector');
END;
$$;

-- Retorna a instituição do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_institution_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_inst_id uuid;
BEGIN
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT u.institution_id INTO v_inst_id
    FROM public.users u
    WHERE u.id = v_uid;

    RETURN v_inst_id;
END;
$$;

-- Multi-Tenant: Verifica se o usuário pode gerenciar um comunicado específico.
-- Superadmins gerenciam comunicados globais e de qualquer instituição.
-- Administradores institucionais gerenciam apenas comunicados de sua própria instituição.
CREATE OR REPLACE FUNCTION public.can_manage_notification(p_institution_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_user_inst_id uuid;
BEGIN
    IF auth.role() = 'service_role' OR public.is_super_admin_user() THEN
        RETURN true;
    END IF;

    IF public.is_admin_user() THEN
        v_user_inst_id := public.get_current_user_institution_id();
        -- Administrador de instituição só pode gerenciar comunicados com escopo explícito da sua instituição
        RETURN p_institution_id IS NOT NULL AND v_user_inst_id IS NOT NULL AND p_institution_id = v_user_inst_id;
    END IF;

    RETURN false;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. TRIGGERS: TIMESTAMPS (BEFORE) E AUDITORIA (AFTER)
-- ------------------------------------------------------------------------------

-- Trigger BEFORE para garantia de timestamps e imutabilidade de metadados
CREATE OR REPLACE FUNCTION public.trg_institutional_notifications_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := coalesce(NEW.created_at, now());
        NEW.updated_at := now();
        NEW.created_by := coalesce(NEW.created_by, auth.uid());
        NEW.updated_by := coalesce(NEW.updated_by, auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := now();
        NEW.created_at := OLD.created_at; -- imutável
        NEW.created_by := OLD.created_by; -- imutável
        NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_institutional_notifications_timestamps ON public.institutional_notifications;
CREATE TRIGGER trg_institutional_notifications_timestamps
    BEFORE INSERT OR UPDATE ON public.institutional_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_institutional_notifications_timestamps();

-- Trigger AFTER para registrar na trilha de auditoria (INSERT, UPDATE, DELETE)
CREATE OR REPLACE FUNCTION public.trg_institutional_notifications_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_actor_id uuid := auth.uid();
    v_actor_role text;
    v_action text;
BEGIN
    SELECT u.role INTO v_actor_role FROM public.users u WHERE u.id = v_actor_id;

    IF TG_OP = 'INSERT' THEN
        v_action := CASE
            WHEN NEW.status = 'published' THEN 'published'
            WHEN NEW.status = 'scheduled' THEN 'scheduled'
            ELSE 'created'
        END;

        INSERT INTO public.notification_audit_log (
            notification_id,
            notification_title,
            action,
            actor_id,
            actor_role,
            details
        ) VALUES (
            NEW.id,
            NEW.title,
            v_action,
            v_actor_id,
            coalesce(v_actor_role, auth.role()),
            jsonb_build_object(
                'status', NEW.status,
                'type', NEW.type,
                'priority', NEW.priority,
                'target_audience', NEW.target_audience
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := CASE
            WHEN OLD.status <> NEW.status AND NEW.status = 'published' THEN 'published'
            WHEN OLD.status <> NEW.status AND NEW.status = 'in_progress' THEN 'started'
            WHEN OLD.status <> NEW.status AND NEW.status = 'completed' THEN 'completed'
            WHEN OLD.status <> NEW.status AND NEW.status = 'postponed' THEN 'postponed'
            WHEN OLD.status <> NEW.status AND NEW.status = 'cancelled' THEN 'cancelled'
            WHEN OLD.status <> NEW.status AND NEW.status = 'scheduled' THEN 'scheduled'
            ELSE 'updated'
        END;

        INSERT INTO public.notification_audit_log (
            notification_id,
            notification_title,
            action,
            actor_id,
            actor_role,
            details
        ) VALUES (
            NEW.id,
            NEW.title,
            v_action,
            v_actor_id,
            coalesce(v_actor_role, auth.role()),
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_start', OLD.scheduled_start_at,
                'new_start', NEW.scheduled_start_at,
                'old_end', OLD.scheduled_end_at,
                'new_end', NEW.scheduled_end_at
            )
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Em AFTER DELETE o registro em institutional_notifications ja foi removido.
        -- O uso de NULL em notification_id preserva a integridade referencial com ON DELETE SET NULL,
        -- gravando o id original em details->deleted_id e mantendo o historico perene e inexpugnavel.
        INSERT INTO public.notification_audit_log (
            notification_id,
            notification_title,
            action,
            actor_id,
            actor_role,
            details
        ) VALUES (
            NULL,
            OLD.title,
            'deleted',
            v_actor_id,
            coalesce(v_actor_role, auth.role()),
            jsonb_build_object(
                'deleted_id', OLD.id,
                'deleted_status', OLD.status,
                'deleted_type', OLD.type,
                'deleted_at', now()
            )
        );
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_institutional_notifications_audit ON public.institutional_notifications;
CREATE TRIGGER trg_institutional_notifications_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.institutional_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_institutional_notifications_audit();

-- ------------------------------------------------------------------------------
-- 6. POLÍTICAS RLS (ROW-LEVEL SECURITY)
-- ------------------------------------------------------------------------------
ALTER TABLE public.institutional_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_audit_log ENABLE ROW LEVEL SECURITY;

-- institutional_notifications: Administradores gerenciam comunicados de acordo com o escopo multi-tenant
DROP POLICY IF EXISTS admin_select_institutional_notifications ON public.institutional_notifications;
CREATE POLICY admin_select_institutional_notifications
    ON public.institutional_notifications
    FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin_user()
        OR (public.is_admin_user() AND (institution_id IS NULL OR institution_id = public.get_current_user_institution_id()))
    );

DROP POLICY IF EXISTS admin_insert_institutional_notifications ON public.institutional_notifications;
CREATE POLICY admin_insert_institutional_notifications
    ON public.institutional_notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (public.can_manage_notification(institution_id));

DROP POLICY IF EXISTS admin_update_institutional_notifications ON public.institutional_notifications;
CREATE POLICY admin_update_institutional_notifications
    ON public.institutional_notifications
    FOR UPDATE
    TO authenticated
    USING (public.can_manage_notification(institution_id))
    WITH CHECK (public.can_manage_notification(institution_id));

-- Exclusão física restrita a superadministradores (preserva auditoria por ON DELETE SET NULL)
DROP POLICY IF EXISTS admin_delete_institutional_notifications ON public.institutional_notifications;
CREATE POLICY admin_delete_institutional_notifications
    ON public.institutional_notifications
    FOR DELETE
    TO authenticated
    USING (public.is_super_admin_user());

-- institutional_notifications: Estudantes e Professores autenticados (somente leitura autorizada)
DROP POLICY IF EXISTS authenticated_read_notifications ON public.institutional_notifications;
CREATE POLICY authenticated_read_notifications
    ON public.institutional_notifications
    FOR SELECT
    TO authenticated
    USING (
        status IN ('published', 'in_progress', 'completed', 'postponed', 'cancelled')
        AND published_at IS NOT NULL
        AND published_at <= now()
        AND (
            target_audience = 'all'
            OR (target_audience = 'students' AND EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'student'
            ))
            OR (target_audience = 'teachers' AND EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'teacher'
            ))
            OR (target_audience = 'institution_admins' AND EXISTS (
                SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('institution_admin', 'admin', 'super_admin')
            ))
            OR (target_audience = 'specific_institution' AND institution_id = public.get_current_user_institution_id())
        )
    );

-- institutional_notifications: Leitura pública para avisos gerais de manutenção (anon)
DROP POLICY IF EXISTS public_read_maintenance_notices ON public.institutional_notifications;
CREATE POLICY public_read_maintenance_notices
    ON public.institutional_notifications
    FOR SELECT
    TO anon
    USING (
        status IN ('published', 'in_progress', 'completed', 'postponed')
        AND published_at IS NOT NULL
        AND published_at <= now()
        AND target_audience = 'all'
        AND type IN (
            'scheduled_maintenance',
            'maintenance_in_progress',
            'maintenance_completed',
            'maintenance_postponed',
            'maintenance_cancelled'
        )
    );

-- user_notification_reads: Estudantes gerenciam seu próprio estado de leitura
DROP POLICY IF EXISTS user_read_own_notification_reads ON public.user_notification_reads;
CREATE POLICY user_read_own_notification_reads
    ON public.user_notification_reads
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin_user());

DROP POLICY IF EXISTS user_insert_own_notification_reads ON public.user_notification_reads;
CREATE POLICY user_insert_own_notification_reads
    ON public.user_notification_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_update_own_notification_reads ON public.user_notification_reads;
CREATE POLICY user_update_own_notification_reads
    ON public.user_notification_reads
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_delete_own_notification_reads ON public.user_notification_reads;
CREATE POLICY user_delete_own_notification_reads
    ON public.user_notification_reads
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_super_admin_user());

-- notification_audit_log: Visível apenas para administradores autorizados
DROP POLICY IF EXISTS admin_read_notification_audit ON public.notification_audit_log;
CREATE POLICY admin_read_notification_audit
    ON public.notification_audit_log
    FOR SELECT
    TO authenticated
    USING (public.is_admin_user());

-- ------------------------------------------------------------------------------
-- 7. FUNÇÕES RPC PARA CONSUMO SEGURO PELO FRONTEND
-- ------------------------------------------------------------------------------

-- Marcar notificação como lida com validação estrita de visibilidade e Session Guard
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(
    p_notification_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_is_active boolean := true;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Autenticação obrigatória' USING errcode = '42501';
    END IF;

    -- Session Guard: Não permite marcação por sessões secundárias recusadas ou expiradas
    IF NOT public.is_admin_user() AND auth.role() <> 'service_role' THEN
        BEGIN
            v_is_active := public.is_current_jwt_session_active();
        EXCEPTION WHEN undefined_function THEN
            v_is_active := true; -- Fallback seguro em ambientes sem Session Guard
        END;

        IF NOT v_is_active THEN
            RAISE EXCEPTION 'SESSION_GUARD_REFUSED: Sessão inativa ou expirada pelo First Session Wins' USING errcode = '42501';
        END IF;
    END IF;

    -- Garante que a notificação existe e está realmente visível/elegível para este usuário
    IF NOT EXISTS (
        SELECT 1 FROM public.institutional_notifications n
        WHERE n.id = p_notification_id
          AND (
              public.is_super_admin_user()
              OR (
                  n.status IN ('published', 'in_progress', 'completed', 'postponed', 'cancelled')
                  AND n.published_at IS NOT NULL
                  AND n.published_at <= now()
                  AND (
                      n.target_audience = 'all'
                      OR (n.target_audience = 'students' AND EXISTS (
                          SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'student'
                      ))
                      OR (n.target_audience = 'teachers' AND EXISTS (
                          SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'teacher'
                      ))
                      OR (n.target_audience = 'institution_admins' AND EXISTS (
                          SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role IN ('institution_admin', 'admin', 'super_admin')
                      ))
                      OR (n.target_audience = 'specific_institution' AND n.institution_id = public.get_current_user_institution_id())
                  )
              )
          )
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Notificação não encontrada ou não disponível para este usuário');
    END IF;

    INSERT INTO public.user_notification_reads (user_id, notification_id, read_at)
    VALUES (v_uid, p_notification_id, now())
    ON CONFLICT (user_id, notification_id)
    DO UPDATE SET read_at = now();

    RETURN jsonb_build_object('success', true, 'notification_id', p_notification_id);
END;
$$;

-- Marcar todas as notificações elegíveis como lidas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_count integer := 0;
    v_is_active boolean := true;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Autenticação obrigatória' USING errcode = '42501';
    END IF;

    -- Session Guard: Não permite bypass por sessões secundárias recusadas ou expiradas
    IF NOT public.is_admin_user() AND auth.role() <> 'service_role' THEN
        BEGIN
            v_is_active := public.is_current_jwt_session_active();
        EXCEPTION WHEN undefined_function THEN
            v_is_active := true;
        END;

        IF NOT v_is_active THEN
            RAISE EXCEPTION 'SESSION_GUARD_REFUSED: Sessão inativa ou expirada pelo First Session Wins' USING errcode = '42501';
        END IF;
    END IF;

    WITH eligible AS (
        SELECT n.id
        FROM public.institutional_notifications n
        WHERE n.status IN ('published', 'in_progress', 'completed', 'postponed', 'cancelled')
          AND n.published_at IS NOT NULL
          AND n.published_at <= now()
          AND (
              n.target_audience = 'all'
              OR (n.target_audience = 'students' AND EXISTS (
                  SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'student'
              ))
              OR (n.target_audience = 'teachers' AND EXISTS (
                  SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'teacher'
              ))
              OR (n.target_audience = 'institution_admins' AND EXISTS (
                  SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role IN ('institution_admin', 'admin', 'super_admin')
              ))
              OR (n.target_audience = 'specific_institution' AND n.institution_id = (
                  SELECT u.institution_id FROM public.users u WHERE u.id = v_uid
              ))
          )
    ),
    inserted AS (
        INSERT INTO public.user_notification_reads (user_id, notification_id, read_at)
        SELECT v_uid, eligible.id, now()
        FROM eligible
        ON CONFLICT (user_id, notification_id)
        DO NOTHING
        RETURNING notification_id
    )
    SELECT count(*) INTO v_count FROM inserted;

    RETURN jsonb_build_object('success', true, 'marked_count', v_count);
END;
$$;

-- Buscar feed do estudante com status de leitura computado e validação Session Guard
CREATE OR REPLACE FUNCTION public.get_student_notifications(
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    notification_id uuid,
    title text,
    message text,
    type text,
    priority text,
    status text,
    target_audience text,
    institution_id uuid,
    affected_resources jsonb,
    scheduled_start_at timestamptz,
    scheduled_end_at timestamptz,
    published_at timestamptz,
    timezone text,
    created_at timestamptz,
    updated_at timestamptz,
    is_read boolean,
    read_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_is_active boolean := true;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Autenticação obrigatória' USING errcode = '42501';
    END IF;

    -- Session Guard: Não permite leitura por sessões secundárias recusadas ou expiradas
    IF NOT public.is_admin_user() AND auth.role() <> 'service_role' THEN
        BEGIN
            v_is_active := public.is_current_jwt_session_active();
        EXCEPTION WHEN undefined_function THEN
            v_is_active := true;
        END;

        IF NOT v_is_active THEN
            RAISE EXCEPTION 'SESSION_GUARD_REFUSED: Sessão inativa ou expirada pelo First Session Wins' USING errcode = '42501';
        END IF;
    END IF;

    RETURN QUERY
    SELECT
        n.id AS notification_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.status,
        n.target_audience,
        n.institution_id,
        n.affected_resources,
        n.scheduled_start_at,
        n.scheduled_end_at,
        n.published_at,
        n.timezone,
        n.created_at,
        n.updated_at,
        (r.read_at IS NOT NULL) AS is_read,
        r.read_at
    FROM public.institutional_notifications n
    LEFT JOIN public.user_notification_reads r
        ON r.notification_id = n.id AND r.user_id = v_uid
    WHERE n.status IN ('published', 'in_progress', 'completed', 'postponed', 'cancelled')
      AND n.published_at IS NOT NULL
      AND n.published_at <= now()
      AND (
          n.target_audience = 'all'
          OR (n.target_audience = 'students' AND EXISTS (
              SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'student'
          ))
          OR (n.target_audience = 'teachers' AND EXISTS (
              SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role = 'teacher'
          ))
          OR (n.target_audience = 'institution_admins' AND EXISTS (
              SELECT 1 FROM public.users u WHERE u.id = v_uid AND u.role IN ('institution_admin', 'admin', 'super_admin')
          ))
          OR (n.target_audience = 'specific_institution' AND n.institution_id = (
              SELECT u.institution_id FROM public.users u WHERE u.id = v_uid
          ))
      )
    ORDER BY
        CASE n.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            ELSE 5
        END ASC,
        n.published_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. PRIVILÉGIOS E PERMISSÕES (GRANT / REVOKE)
-- ------------------------------------------------------------------------------
REVOKE ALL ON TABLE public.institutional_notifications FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.user_notification_reads FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.notification_audit_log FROM PUBLIC, anon;

GRANT SELECT ON TABLE public.institutional_notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.institutional_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_notification_reads TO authenticated;
GRANT SELECT ON TABLE public.notification_audit_log TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_institution_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_notification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_as_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_notifications(integer, integer) TO authenticated;

COMMIT;
