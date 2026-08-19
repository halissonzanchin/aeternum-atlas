/**
 * Aeternum Voice AI Brain — Powered by Cérebro Aeternum
 * Conecta os Tutores de Voz (Eduardo 🇧🇷, Antonia 🇪🇸, Ariana 🇺🇸, Fabian 🇩🇪)
 * diretamente ao Cérebro Aeternum com respostas humanizadas, empáticas e concisas.
 */

import { cerebroAeternum } from "../cerebro-aeternum/cerebroAeternum.js";

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  return cerebroAeternum.consultar({
    query: question,
    mode: "voice",
    language,
    context
  });
}

export async function generateDynamicVoiceResponse(question, context = {}, language = "pt") {
  return generateVoiceTutorResponse(question, context, language);
}
