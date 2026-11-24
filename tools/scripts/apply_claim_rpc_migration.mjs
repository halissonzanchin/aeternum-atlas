import { runSupabaseSql } from './supabase_admin_helper.mjs';

async function main() {
  console.log("Applying unified atomic claim RPC migration...");

  // 1. Drop existing version to prevent signature overload conflicts
  await runSupabaseSql(`
    DROP FUNCTION IF EXISTS public.claim_next_beta_email_notification();
    DROP FUNCTION IF EXISTS public.claim_next_beta_email_notification(UUID, UUID);
  `);

  // 2. Create updated unified RPC with atomic FOR UPDATE SKIP LOCKED
  await runSupabaseSql(`
    CREATE OR REPLACE FUNCTION public.claim_next_beta_email_notification(
        p_notification_id UUID DEFAULT NULL,
        p_application_id UUID DEFAULT NULL
    )
    RETURNS TABLE(
        id UUID,
        application_id UUID,
        recipient_email TEXT,
        subject TEXT,
        event_type TEXT,
        attempts INT
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
    DECLARE
        v_target_id UUID;
        v_now TIMESTAMPTZ := timezone('utc'::text, now());
    BEGIN
        -- Verificação estrita de autorização exclusiva para serviço interno
        IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) <> 'service_role' THEN
            RAISE EXCEPTION 'Acesso negado: claim_next_beta_email_notification e restrita ao servico interno autorizado.'
                USING ERRCODE = '42501';
        END IF;

        -- Seleciona a notificação elegível com lock atômico (FOR UPDATE SKIP LOCKED)
        SELECT q.id INTO v_target_id
        FROM public.beta_email_notifications q
        WHERE (p_notification_id IS NULL OR q.id = p_notification_id)
          AND (p_application_id IS NULL OR q.application_id = p_application_id)
          AND (
              (q.status = 'queued' AND q.attempts < q.max_attempts)
           OR (q.status = 'failed' AND q.attempts < q.max_attempts AND q.last_attempt_at < v_now - (q.attempts * INTERVAL '2 minutes'))
           OR (q.status = 'processing' AND q.last_attempt_at < v_now - INTERVAL '5 minutes')
          )
        ORDER BY q.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1;

        IF v_target_id IS NULL THEN
            RETURN;
        END IF;

        -- Atualiza atomicamente para 'processing', incrementando tentativas e registrando timestamp
        UPDATE public.beta_email_notifications b
        SET status = 'processing',
            attempts = b.attempts + 1,
            last_attempt_at = v_now
        WHERE b.id = v_target_id;

        RETURN QUERY
        SELECT n.id, n.application_id, n.recipient_email, n.subject, n.event_type, n.attempts
        FROM public.beta_email_notifications n
        WHERE n.id = v_target_id;
    END;
    $$;

    REVOKE ALL ON FUNCTION public.claim_next_beta_email_notification(UUID, UUID) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.claim_next_beta_email_notification(UUID, UUID) FROM anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.claim_next_beta_email_notification(UUID, UUID) TO service_role;
  `);

  console.log("RPC successfully created and permissions granted to service_role.");
}

main().catch(console.error);
