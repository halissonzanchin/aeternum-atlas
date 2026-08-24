-- Migration: 20260818_voice_sessions.sql
-- Descrição: Estrutura de persistência para sessões de voz em tempo real do Aeternum Vita

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Sessões de Voz
CREATE TABLE IF NOT EXISTS public.voice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    room_name VARCHAR(128) NOT NULL UNIQUE,
    participant_identity VARCHAR(128) NOT NULL,
    agent_name VARCHAR(128) NOT NULL DEFAULT 'aeternum-vita-voice',
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'timed_out')),
    idempotency_key VARCHAR(256),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consulta rápida
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user_id ON public.voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_room_name ON public.voice_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_idempotency_key ON public.voice_sessions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON public.voice_sessions(status);

-- 2. Tabela de Mensagens e Transcrições da Conversa
CREATE TABLE IF NOT EXISTS public.voice_transcript_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
    speaker VARCHAR(16) NOT NULL CHECK (speaker IN ('user', 'agent', 'system')),
    content TEXT NOT NULL,
    sequence_order INTEGER NOT NULL,
    audio_timestamp_ms BIGINT DEFAULT 0,
    confidence NUMERIC(4,3),
    is_final BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_transcript_session_id ON public.voice_transcript_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_transcript_order ON public.voice_transcript_entries(session_id, sequence_order);

-- 3. Tabela de Métricas e Telemetria de Áudio
CREATE TABLE IF NOT EXISTS public.voice_usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.voice_sessions(id) ON DELETE CASCADE,
    stt_duration_seconds NUMERIC(8,2) DEFAULT 0,
    tts_characters_count INTEGER DEFAULT 0,
    llm_prompt_tokens INTEGER DEFAULT 0,
    llm_completion_tokens INTEGER DEFAULT 0,
    time_to_first_audio_ms INTEGER,
    jitter_avg_ms NUMERIC(6,2),
    packet_loss_percentage NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_metrics_session_id ON public.voice_usage_metrics(session_id);

-- 4. Políticas de Segurança em Nível de Linha (RLS)
ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_transcript_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Usuários só podem visualizar e gerenciar suas próprias sessões
CREATE POLICY "Users can view own voice sessions"
    ON public.voice_sessions FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own voice sessions"
    ON public.voice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own voice sessions"
    ON public.voice_sessions FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Políticas para Transcrições
CREATE POLICY "Users can view transcripts of own sessions"
    ON public.voice_transcript_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.voice_sessions
            WHERE public.voice_sessions.id = public.voice_transcript_entries.session_id
            AND (public.voice_sessions.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

CREATE POLICY "Users can insert transcripts for own sessions"
    ON public.voice_transcript_entries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.voice_sessions
            WHERE public.voice_sessions.id = public.voice_transcript_entries.session_id
            AND (public.voice_sessions.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- Políticas para Métricas
CREATE POLICY "Users can view metrics of own sessions"
    ON public.voice_usage_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.voice_sessions
            WHERE public.voice_sessions.id = public.voice_usage_metrics.session_id
            AND (public.voice_sessions.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );
