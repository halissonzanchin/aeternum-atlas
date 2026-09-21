-- Migration: 20260921000000_restore_canonical_consume_ai_rate_limit.sql
-- Description: Restore canonical consume_ai_rate_limit function contract in Staging

BEGIN;

DROP FUNCTION IF EXISTS public.consume_ai_rate_limit(integer, integer);

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(
  max_requests integer DEFAULT 20,
  window_seconds integer DEFAULT 60
)
RETURNS TABLE(
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller UUID := auth.uid();
  limit_row public.ai_rate_limits%ROWTYPE;
  safe_max INTEGER := LEAST(GREATEST(max_requests, 1), 120);
  safe_window INTEGER := LEAST(GREATEST(window_seconds, 10), 3600);
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória.';
  END IF;

  INSERT INTO public.ai_rate_limits (user_id, window_started_at, request_count, updated_at)
  VALUES (caller, NOW(), 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.ai_rate_limits.window_started_at <= NOW() - make_interval(secs => safe_window)
        THEN NOW()
      ELSE public.ai_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.ai_rate_limits.window_started_at <= NOW() - make_interval(secs => safe_window)
        THEN 1
      ELSE public.ai_rate_limits.request_count + 1
    END,
    updated_at = NOW()
  RETURNING * INTO limit_row;

  allowed := limit_row.request_count <= safe_max;
  remaining := GREATEST(safe_max - limit_row.request_count, 0);
  retry_after_seconds := CASE
    WHEN allowed THEN 0
    ELSE GREATEST(
      1,
      safe_window - FLOOR(EXTRACT(EPOCH FROM (NOW() - limit_row.window_started_at)))::INTEGER
    )
  END;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(integer, integer) TO authenticated, service_role;

COMMIT;
