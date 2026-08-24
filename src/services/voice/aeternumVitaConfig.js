/**
 * Public Aeternum Vita configuration.
 *
 * Provider credentials and LiveKit signing secrets are intentionally absent:
 * the authenticated voice-token Edge Function is the only token issuer.
 */

const metaEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

const pipeline = String(metaEnv.VITE_AETERNUM_VITA_PIPELINE || "livekit").toLowerCase();

export const VITA_VOICE_CONFIG = Object.freeze({
  pipeline,
  enabled: pipeline === "livekit",
  agentName: String(metaEnv.VITE_LIVEKIT_AGENT_NAME || "aeternum-vita-voice")
});

export function isVitaVoiceEnabled() {
  return VITA_VOICE_CONFIG.enabled;
}
