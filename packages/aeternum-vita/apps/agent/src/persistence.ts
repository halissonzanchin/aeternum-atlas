/**
 * Serviço de Persistência Assíncrona de Transcrições e Telemetria
 * Registra as mensagens faladas no Supabase (voice_transcript_entries e voice_usage_metrics)
 */

export interface TranscriptPayload {
  sessionId?: string;
  roomName?: string;
  speaker: "user" | "agent" | "system";
  content: string;
  sequenceOrder: number;
  audioTimestampMs?: number;
  confidence?: number;
}

export interface MetricPayload {
  sessionId?: string;
  sttDurationSeconds?: number;
  ttsCharactersCount?: number;
  llmPromptTokens?: number;
  llmCompletionTokens?: number;
  timeToFirstAudioMs?: number;
}

export const persistTranscriptEntry = async (
  payload: TranscriptPayload,
  supabaseUrl?: string,
  supabaseKey?: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<boolean> => {
  if (!supabaseUrl || !supabaseKey || !payload.sessionId || !payload.content.trim()) {
    return false;
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/voice_transcript_entries`;
    const response = await fetchImplementation(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        session_id: payload.sessionId,
        speaker: payload.speaker,
        content: payload.content.trim(),
        sequence_order: payload.sequenceOrder,
        audio_timestamp_ms: payload.audioTimestampMs || 0,
        confidence: payload.confidence || 0.95,
        is_final: true,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn("Falha silenciosa na persistência de transcrição:", error);
    return false;
  }
};

export const persistUsageMetric = async (
  payload: MetricPayload,
  supabaseUrl?: string,
  supabaseKey?: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<boolean> => {
  if (!supabaseUrl || !supabaseKey || !payload.sessionId) {
    return false;
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/voice_usage_metrics`;
    const response = await fetchImplementation(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        session_id: payload.sessionId,
        stt_duration_seconds: payload.sttDurationSeconds || 0,
        tts_characters_count: payload.ttsCharactersCount || 0,
        llm_prompt_tokens: payload.llmPromptTokens || 0,
        llm_completion_tokens: payload.llmCompletionTokens || 0,
        time_to_first_audio_ms: payload.timeToFirstAudioMs || 0,
      }),
    });

    return response.ok;
  } catch (error) {
    console.warn("Falha silenciosa na gravação de métricas:", error);
    return false;
  }
};