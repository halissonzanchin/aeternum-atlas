import { cerebroAeternumVita } from "../cerebro-vita/cerebroAeternumVita.js";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService.js";

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

  const personaKey = String(context.persona || (language === "es" ? "antonia" : language === "en" ? "ariana" : language === "de" ? "fabian" : "eduardo")).toLowerCase();

  // 1. Se for comando explícito de Sabatina Oral ou sessão de sabatina ativa
  if (
    cerebroAeternumVita.isQuizActivationTrigger(cleanQ) ||
    cerebroAeternumVita.activeQuizSessions[personaKey]?.active
  ) {
    return generateVoiceTutorResponse(cleanQ, context, language);
  }

  // 2. Chamar o serviço Atlas AI / Supabase Edge Function com LLM Gemini 2.5 Flash / Gemma
  try {
    const streamContext = {
      ...context,
      mode: "voice",
      source: "voice",
      language,
      persona: personaKey,
      tutorPromptDirective: context.tutorPromptDirective || (
        personaKey === "antonia" ? "Eres Antonia, mentora de voz en español cálida y empática. Responde de forma concisa y hablada en 1 a 2 frases sin Markdown ni emojis, cerrando con una pregunta corta." :
        personaKey === "ariana" ? "You are Ariana, dynamic English voice mentor. Answer in 1 to 2 spoken sentences without Markdown or emojis, ending with a short open question." :
        personaKey === "fabian" ? "Du bist Fabian, akademischer deutscher Sprachmentor. Antworte in 1 bis 2 gesprochenen Sätzen ohne Markdown oder Emojis." :
        "Você é o Eduardo, mentor sênior de voz em português do Brasil da Aeternum Vita. Responda em Português do Brasil de forma extremamente natural, acolhedora, calorosa e concisa (1 a 2 frases faladas no máximo), sem nenhum símbolo de Markdown ou emojis, e termine sempre com uma pergunta curta aberta."
      )
    };

    const response = await atlasAITutorService.processMessageStream(
      cleanQ,
      streamContext,
      null
    );

    if (response?.text) {
      return response.text;
    }
  } catch (err) {
    console.warn("LLM Edge Function notice, falling back to Cérebro Vita:", err);
  }

  // 3. Fallback inteligente do Cérebro Vita
  return generateVoiceTutorResponse(cleanQ, context, language);
}
