import {
  getSupabaseClient,
  isSupabaseConfigured,
  supabaseConfig
} from "../supabase/supabaseClient.js";
import { isVitaVoiceEnabled } from "./aeternumVitaConfig.js";

const ALLOWED_TUTORS = new Set(["eduardo", "antonia", "ariana", "fabian", "marina"]);

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
export async function requestVitaConnection({ tutorId, context3d, idempotencyKey, signal } = {}) {
  if (!isVitaVoiceEnabled()) {
    throw connectionError(
      "O recurso VoiceStudio não está disponível para esta conta de demonstração institucional.",
      "VOICESTUDIO_NOT_PERMITTED"
    );
  }

  const normalizedTutor = String(tutorId || "marina").toLowerCase();
  if (!ALLOWED_TUTORS.has(normalizedTutor)) {
    throw connectionError("Tutor de voz inválido.", "INVALID_TUTOR");
  }

  if (!idempotencyKey) {
    throw connectionError("Identificador de sessão de voz ausente.", "MISSING_IDEMPOTENCY_KEY");
  }

  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost");
  const isLocalRuntime =
    isLocalHost || String(import.meta.env.VITE_ATLAS_RUNTIME || "").toLowerCase() === "local";

  if (!isSupabaseConfigured() && !isLocalRuntime) {
    throw connectionError("A conexão segura da Aeternum Vita não está configurada.", "VOICE_NOT_CONFIGURED");
  }

  let accessToken = null;
  try {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      const { data } = await client.auth.getSession();
      accessToken = data?.session?.access_token || null;
    }
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    if (isLocalRuntime) {
      accessToken = "atlas-local-dev-token";
    } else {
      throw connectionError("Entre em sua conta para iniciar uma sessão de voz.", "VOICE_AUTH_REQUIRED");
    }
  }

  const tokenEndpoint =
    import.meta.env.VITE_VOICE_TOKEN_URL ||
    (isLocalRuntime
      ? "http://127.0.0.1:3001/functions/v1/voice-token"
      : `${supabaseConfig.url}/functions/v1/voice-token`);
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseConfig.anonKey || "local-dev-anon-key",
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      tutor_id: normalizedTutor,
      tutorId: normalizedTutor,
      ...(context3d ? { context_3d: context3d } : {})
    })
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

  const normalizedServerUrl = String(payload.server_url).replace(
    /^ws:\/\/localhost:/i,
    "ws://127.0.0.1:"
  );

  return {
    serverUrl: normalizedServerUrl,
    token: payload.participant_token,
    roomName: payload.room_name,
    tutorId: payload.tutor_id || normalizedTutor,
    participantIdentity: payload.participant_identity || ""
  };
}
