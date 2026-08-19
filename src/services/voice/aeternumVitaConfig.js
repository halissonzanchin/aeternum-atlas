/**
 * Aeternum Vita Voice Configuration
 * LiveKit Cloud & Deepgram Aura-2 Direct Engine configuration
 */

export const VITA_VOICE_CONFIG = {
  livekitUrl: import.meta.env.VITE_LIVEKIT_URL || "wss://aeternum-atlas-0c2hve13.livekit.cloud",
  livekitApiKey: import.meta.env.VITE_LIVEKIT_API_KEY || "APIFZFEnuspBHzf",
  livekitApiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || "FuRXef8oZh7WfpY7qJ5YRe5sZzcEn6z1MqRHimKOrI1D",
  livekitAgentName: import.meta.env.VITE_LIVEKIT_AGENT_NAME || "aeternum-vita-voice",
  deepgramApiKey: import.meta.env.VITE_DEEPGRAM_API_KEY || "578cc8e2294e0b01fad0afc13f85e799dfa270df",
  livekitVoiceId: import.meta.env.VITE_LIVEKIT_VOICE_ID || "a0e99841-438c-4a64-b679-ae501e7d6091"
};
