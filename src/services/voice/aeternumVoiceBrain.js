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
  const cleanQ = String(question || "").trim();
  if (!cleanQ) return "";
  // Compatibility-only local path. The production voice UI uses the isolated
  // server-side LiveKit agent and never routes through the Atlas IA service.
  return generateVoiceTutorResponse(cleanQ, context, language);
}
