/**
 * Compatibility boundary for the retired browser STT/TTS pipeline.
 *
 * Vita voice now runs only through the authenticated LiveKit session. Keeping
 * this small shim makes stale imports fail closed instead of exposing a silent
 * browser/provider fallback.
 */
export { AETERNUM_VITA_TUTORS, getTutorForLanguage } from "./aeternumTutorCatalog.js";

function retiredPipelineError() {
  const error = new Error("O pipeline de voz legado foi desativado. Use a sessão LiveKit da Aeternum Vita.");
  error.code = "VITA_LEGACY_PIPELINE_RETIRED";
  return error;
}

export const aeternumVitaVoiceService = Object.freeze({
  startSession() {
    throw retiredPipelineError();
  },
  stopSession() {},
  startListening() {
    throw retiredPipelineError();
  },
  speak() {
    return Promise.reject(retiredPipelineError());
  }
});
