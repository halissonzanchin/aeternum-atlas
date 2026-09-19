-- AETERNUM 26 — FASE 7.1: TELEMETRIA REAL DE APRENDIZAGEM
-- Migração aditiva. Preserva sessões e resultados existentes.

CREATE TABLE IF NOT EXISTS public.viewer_learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_session_id UUID UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID,
  scope TEXT NOT NULL DEFAULT 'viewer' CHECK (scope IN ('account', 'viewer')),
  model_id TEXT,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
  idle_seconds INTEGER NOT NULL DEFAULT 0 CHECK (idle_seconds >= 0),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  ended_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.viewer_learning_sessions ALTER COLUMN model_id DROP NOT NULL;
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS client_session_id UUID;
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'viewer';
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS active_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS idle_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS ended_reason TEXT;
ALTER TABLE public.viewer_learning_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS viewer_learning_sessions_client_session_uidx
  ON public.viewer_learning_sessions(client_session_id)
  WHERE client_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS viewer_learning_sessions_user_start_idx
  ON public.viewer_learning_sessions(user_id, session_start DESC);
CREATE INDEX IF NOT EXISTS viewer_learning_sessions_user_model_idx
  ON public.viewer_learning_sessions(user_id, model_id, session_start DESC);

CREATE TABLE IF NOT EXISTS public.viewer_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.viewer_learning_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID,
  model_id TEXT,
  event_type TEXT NOT NULL,
  structure_id TEXT,
  annotation_id TEXT,
  quiz_id TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.viewer_learning_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.viewer_learning_events ADD COLUMN IF NOT EXISTS institution_id UUID;
ALTER TABLE public.viewer_learning_events ADD COLUMN IF NOT EXISTS model_id TEXT;
ALTER TABLE public.viewer_learning_events ALTER COLUMN event_data SET DEFAULT '{}'::jsonb;

UPDATE public.viewer_learning_events AS event
SET
  user_id = COALESCE(event.user_id, session.user_id),
  institution_id = COALESCE(event.institution_id, session.institution_id),
  model_id = COALESCE(event.model_id, session.model_id)
FROM public.viewer_learning_sessions AS session
WHERE event.session_id = session.id
  AND (event.user_id IS NULL OR event.institution_id IS NULL OR event.model_id IS NULL);

CREATE INDEX IF NOT EXISTS viewer_learning_events_user_created_idx
  ON public.viewer_learning_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS viewer_learning_events_model_type_idx
  ON public.viewer_learning_events(model_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.viewer_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID,
  model_id TEXT,
  quiz_id TEXT NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'anatomical' CHECK (quiz_type IN ('anatomical', 'theoretical')),
  status TEXT NOT NULL DEFAULT 'completed',
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  incorrect_answers INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS institution_id UUID;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS model_id TEXT;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS quiz_type TEXT NOT NULL DEFAULT 'anatomical';
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS percentage NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS duration_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.viewer_quiz_results ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS viewer_quiz_results_user_created_idx
  ON public.viewer_quiz_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS viewer_quiz_results_user_model_idx
  ON public.viewer_quiz_results(user_id, model_id, created_at DESC);

ALTER TABLE public.viewer_learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewer_learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viewer_quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own learning sessions" ON public.viewer_learning_sessions;
DROP POLICY IF EXISTS "Users can view their own learning sessions" ON public.viewer_learning_sessions;
DROP POLICY IF EXISTS "Users can update their own learning sessions" ON public.viewer_learning_sessions;
DROP POLICY IF EXISTS "Users can insert learning events" ON public.viewer_learning_events;
DROP POLICY IF EXISTS "Users can insert their own learning events" ON public.viewer_learning_events;
DROP POLICY IF EXISTS "Users can view their own learning events" ON public.viewer_learning_events;
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON public.viewer_quiz_results;
DROP POLICY IF EXISTS "Users can update their own quiz results" ON public.viewer_quiz_results;
DROP POLICY IF EXISTS "Users can view their own quiz results" ON public.viewer_quiz_results;
DROP POLICY IF EXISTS "Super Admins can view all sessions" ON public.viewer_learning_sessions;
DROP POLICY IF EXISTS "Super Admins can view all events" ON public.viewer_learning_events;
DROP POLICY IF EXISTS "Super Admins can view all quiz results" ON public.viewer_quiz_results;
DROP POLICY IF EXISTS "Institution staff can view learning sessions" ON public.viewer_learning_sessions;
DROP POLICY IF EXISTS "Institution staff can view learning events" ON public.viewer_learning_events;
DROP POLICY IF EXISTS "Institution staff can view quiz results" ON public.viewer_quiz_results;

CREATE POLICY "Users can insert their own learning sessions"
ON public.viewer_learning_sessions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own learning sessions"
ON public.viewer_learning_sessions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning sessions"
ON public.viewer_learning_sessions FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning events"
ON public.viewer_learning_events FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    session_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.viewer_learning_sessions AS session
      WHERE session.id = session_id AND session.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view their own learning events"
ON public.viewer_learning_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
ON public.viewer_quiz_results FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz results"
ON public.viewer_quiz_results FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own quiz results"
ON public.viewer_quiz_results FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Institution staff can view learning sessions"
ON public.viewer_learning_sessions FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('super_admin', 'admin', 'institution_admin', 'reitor', 'rector', 'coordenador', 'coordinator', 'professor', 'teacher')
  AND (
    public.current_user_role() = 'super_admin'
    OR institution_id = public.current_user_institution_id()
  )
);

CREATE POLICY "Institution staff can view learning events"
ON public.viewer_learning_events FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('super_admin', 'admin', 'institution_admin', 'reitor', 'rector', 'coordenador', 'coordinator', 'professor', 'teacher')
  AND (
    public.current_user_role() = 'super_admin'
    OR institution_id = public.current_user_institution_id()
  )
);

CREATE POLICY "Institution staff can view quiz results"
ON public.viewer_quiz_results FOR SELECT TO authenticated
USING (
  public.current_user_role() IN ('super_admin', 'admin', 'institution_admin', 'reitor', 'rector', 'coordenador', 'coordinator', 'professor', 'teacher')
  AND (
    public.current_user_role() = 'super_admin'
    OR institution_id = public.current_user_institution_id()
  )
);

GRANT SELECT, INSERT, UPDATE ON public.viewer_learning_sessions TO authenticated;
GRANT SELECT, INSERT ON public.viewer_learning_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.viewer_quiz_results TO authenticated;

