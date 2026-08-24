-- Remove o bypass anônimo das políticas iniciais de sessões de voz.
-- Escritas são realizadas exclusivamente pela Edge Function com secret key.

DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Users can insert own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Users can update own voice sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Users can view transcripts of own sessions" ON public.voice_transcript_entries;
DROP POLICY IF EXISTS "Users can insert transcripts for own sessions" ON public.voice_transcript_entries;
DROP POLICY IF EXISTS "Users can view metrics of own sessions" ON public.voice_usage_metrics;

CREATE POLICY "Authenticated users can view own voice sessions"
    ON public.voice_sessions
    FOR SELECT
    TO authenticated
    USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can view own voice transcripts"
    ON public.voice_transcript_entries
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.voice_sessions
            WHERE public.voice_sessions.id = public.voice_transcript_entries.session_id
              AND public.voice_sessions.user_id IS NOT NULL
              AND public.voice_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can view own voice metrics"
    ON public.voice_usage_metrics
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.voice_sessions
            WHERE public.voice_sessions.id = public.voice_usage_metrics.session_id
              AND public.voice_sessions.user_id IS NOT NULL
              AND public.voice_sessions.user_id = auth.uid()
        )
    );
