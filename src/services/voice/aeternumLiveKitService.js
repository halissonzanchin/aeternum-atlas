import {
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseConfig
} from "../supabase/supabaseClient.js";

const ALLOWED_TUTORS = new Set(["eduardo", "antonia", "ariana", "fabian"]);

export function createVitaSessionKey() {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error("Este navegador não oferece geração segura de identificadores de sessão.");
  }
  return globalThis.crypto.randomUUID();
}

function connectionError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Requests short-lived LiveKit credentials from the authenticated server edge.
 * No provider credential or signing operation is ever performed in the browser.
 */
export async function requestVitaConnection({ tutorId, idempotencyKey, signal } = {}) {
  const normalizedTutor = String(tutorId || "eduardo").toLowerCase();
  if (!ALLOWED_TUTORS.has(normalizedTutor)) {
    throw connectionError("Tutor de voz inválido.", "INVALID_TUTOR");
  }

  if (!idempotencyKey) {
    throw connectionError("Identificador de sessão de voz ausente.", "MISSING_IDEMPOTENCY_KEY");
  }

  if (!isSupabaseConfigured()) {
    throw connectionError("A conexão segura da Aeternum Vita não está configurada.", "VOICE_NOT_CONFIGURED");
  }

  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  const accessToken = data?.session?.access_token;
  if (error || !accessToken) {
    throw connectionError("Entre em sua conta para iniciar uma sessão de voz.", "VOICE_AUTH_REQUIRED");
  }

  const response = await fetch(`${supabaseConfig.url}/functions/v1/voice-token`, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseConfig.anonKey,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({ tutor_id: normalizedTutor })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw connectionError(
      payload?.error || "Não foi possível iniciar a sessão de voz.",
      payload?.code || `VOICE_TOKEN_${response.status}`
    );
  }

  if (!payload.server_url || !payload.participant_token) {
    throw connectionError("O servidor de voz devolveu uma resposta incompleta.", "INVALID_VOICE_TOKEN_RESPONSE");
  }

  return {
    serverUrl: payload.server_url,
    token: payload.participant_token,
    roomName: payload.room_name,
    tutorId: payload.tutor_id
  };
}
