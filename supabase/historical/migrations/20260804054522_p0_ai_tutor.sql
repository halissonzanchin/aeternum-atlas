-- AETERNUM 26 — P0: TUTOR IA AUTENTICADO, PERSISTENTE E AUDITÁVEL

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID,
  title TEXT NOT NULL DEFAULT 'Conversa com Atlas AI',
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 8000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  institution_id UUID,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  model_name TEXT,
  input_characters INTEGER NOT NULL DEFAULT 0,
  output_characters INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_conversations_user_updated_idx
  ON public.ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ai_messages_conversation_created_idx
  ON public.ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS ai_audit_events_user_created_idx
  ON public.ai_audit_events(user_id, created_at DESC);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users manage their own AI conversations"
ON public.ai_conversations FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their own AI messages" ON public.ai_messages;
CREATE POLICY "Users view their own AI messages"
ON public.ai_messages FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert their own AI messages" ON public.ai_messages;
CREATE POLICY "Users insert their own AI messages"
ON public.ai_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.ai_conversations AS conversation
    WHERE conversation.id = conversation_id AND conversation.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users view their own AI audit trail" ON public.ai_audit_events;
CREATE POLICY "Users view their own AI audit trail"
ON public.ai_audit_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON public.ai_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT SELECT, INSERT ON public.ai_messages TO authenticated;
GRANT SELECT ON public.ai_audit_events TO authenticated;
GRANT ALL ON public.ai_conversations, public.ai_messages, public.ai_rate_limits, public.ai_audit_events TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(
  max_requests INTEGER DEFAULT 20,
  window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after_seconds INTEGER)
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

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_ai_rate_limit(INTEGER, INTEGER) TO authenticated;
