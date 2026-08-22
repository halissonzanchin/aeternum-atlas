/**
 * Aeternum Voice AI Brain — Powered by Cérebro Aeternum Vita
 * Conecta os Tutores de Voz (Eduardo 🇧🇷, Antonia 🇪🇸, Ariana 🇺🇸, Fabian 🇩🇪)
 * diretamente ao Cérebro Aeternum Vita com respostas humanizadas, empáticas e concisas.
 */

import { cerebroAeternumVita } from "../cerebro-vita/cerebroAeternumVita.js";

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  return cerebroAeternumVita.consultar({
    query: question,
    language,
    persona: context.persona || null,
    context
  });
}

export async function generateDynamicVoiceResponse(question, context = {}, language = "pt") {
  return generateVoiceTutorResponse(question, context, language);
}
