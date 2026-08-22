/**
 * Aeternum Vita Voice Configuration
 * LiveKit Cloud & Deepgram Aura-2 Direct Engine configuration
 */

const metaEnv = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};

export const VITA_VOICE_CONFIG = {
  livekitUrl: metaEnv.VITE_LIVEKIT_URL || "wss://aeternum-atlas-0c2hve13.livekit.cloud",
  livekitApiKey: metaEnv.VITE_LIVEKIT_API_KEY || "APIFZFEnuspBHzf",
  livekitApiSecret: metaEnv.VITE_LIVEKIT_API_SECRET || "FuRXef8oZh7WfpY7qJ5YRe5sZzcEn6z1MqRHimKOrI1D",
  livekitAgentName: metaEnv.VITE_LIVEKIT_AGENT_NAME || "aeternum-vita-voice",
  deepgramApiKey: metaEnv.VITE_DEEPGRAM_API_KEY || "578cc8e2294e0b01fad0afc13f85e799dfa270df",
  livekitVoiceId: metaEnv.VITE_LIVEKIT_VOICE_ID || "a0e99841-438c-4a64-b679-ae501e7d6091",
  cartesiaApiKey: metaEnv.VITE_CARTESIA_API_KEY || "a9ff6058-294b-4395-8a24-912f3bc19183",
  cartesiaVoiceId: metaEnv.VITE_CARTESIA_VOICE_ID || "a0e99841-438c-4a64-b679-ae501e7d6091"
};
