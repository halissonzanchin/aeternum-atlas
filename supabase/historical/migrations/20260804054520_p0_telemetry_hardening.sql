-- AETERNUM 26 — P0: ENCERRAMENTO, RECONCILIAÇÃO E VERDADE DA TELEMETRIA

CREATE OR REPLACE FUNCTION public.enforce_learning_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller UUID := auth.uid();
  caller_institution UUID;
BEGIN
  IF caller IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT profile.institution_id
  INTO caller_institution
  FROM public.users AS profile
  WHERE profile.id = caller AND profile.status IN ('active', 'ativo');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil ativo não encontrado para a identidade autenticada.';
  END IF;

  NEW.user_id := caller;
  NEW.institution_id := caller_institution;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_viewer_learning_session_identity ON public.viewer_learning_sessions;
CREATE TRIGGER enforce_viewer_learning_session_identity
BEFORE INSERT OR UPDATE ON public.viewer_learning_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();

DROP TRIGGER IF EXISTS enforce_viewer_learning_event_identity ON public.viewer_learning_events;
CREATE TRIGGER enforce_viewer_learning_event_identity
BEFORE INSERT OR UPDATE ON public.viewer_learning_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();

DROP TRIGGER IF EXISTS enforce_viewer_quiz_result_identity ON public.viewer_quiz_results;
CREATE TRIGGER enforce_viewer_quiz_result_identity
BEFORE INSERT OR UPDATE ON public.viewer_quiz_results
FOR EACH ROW EXECUTE FUNCTION public.enforce_learning_identity();

REVOKE ALL ON FUNCTION public.enforce_learning_identity() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reconcile_my_learning_sessions(
  stale_after INTERVAL DEFAULT INTERVAL '3 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  reconciled INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  UPDATE public.viewer_learning_sessions
  SET
    session_end = COALESCE(session_end, last_heartbeat_at),
    duration_seconds = GREATEST(active_seconds, 0),
    status = 'abandoned',
    ended_reason = COALESCE(ended_reason, 'heartbeat_timeout'),
    updated_at = NOW()
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND last_heartbeat_at < NOW() - GREATEST(stale_after, INTERVAL '90 seconds');

  GET DIAGNOSTICS reconciled = ROW_COUNT;
  RETURN reconciled;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_my_learning_sessions(INTERVAL) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reconcile_my_learning_sessions(INTERVAL) TO authenticated;

CREATE OR REPLACE FUNCTION public.reconcile_all_stale_learning_sessions(
  stale_after INTERVAL DEFAULT INTERVAL '3 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  reconciled INTEGER;
BEGIN
  UPDATE public.viewer_learning_sessions
  SET
    session_end = COALESCE(session_end, last_heartbeat_at),
    duration_seconds = GREATEST(active_seconds, 0),
    status = 'abandoned',
    ended_reason = COALESCE(ended_reason, 'heartbeat_timeout'),
    updated_at = NOW()
  WHERE status = 'active'
    AND last_heartbeat_at < NOW() - GREATEST(stale_after, INTERVAL '90 seconds');

  GET DIAGNOSTICS reconciled = ROW_COUNT;
  RETURN reconciled;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_all_stale_learning_sessions(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_all_stale_learning_sessions(INTERVAL) TO service_role;

-- Reconcilia as sessões abandonadas já existentes durante a implantação.
SELECT public.reconcile_all_stale_learning_sessions(INTERVAL '3 minutes');

-- model_access_logs foi substituída pela telemetria V2. Mantida apenas para consulta histórica.
REVOKE INSERT, UPDATE, DELETE ON public.model_access_logs FROM anon, authenticated;
COMMENT ON TABLE public.model_access_logs IS
  'LEGACY READ-ONLY: substituída por viewer_learning_sessions, viewer_learning_events e viewer_quiz_results no Aeternum 26.';
