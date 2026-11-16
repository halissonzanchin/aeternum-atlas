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

export function isVitaVoiceEnabled(targetUser = null) {
  if (!VITA_VOICE_CONFIG.enabled) {
    return false;
  }

  // Institutional Demo Isolation Guard: VoiceStudio is strictly disabled for demo institutional accounts
  let user = targetUser;
  if (!user && typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("aeternum_auth_profile");
      if (stored) {
        user = JSON.parse(stored);
      }
    } catch {}
  }

  if (user) {
    const email = String(user.email || "").toLowerCase();
    if (email === "demo.institucional@aeternumatlas.com" || email.startsWith("demo.institucional")) {
      return false;
    }
  }

  return true;
}
