/**
 * Aeternum Voice AI Brain — Live Neural LLM Intelligence Engine
 * Powered by Google Gemini 3.1 Flash-Lite & Multilingual Anatomical Knowledge Graph
 *
 * 100% Dynamic, Unscripted, Empathetic & Fluid Conversations for All Tutors:
 * - Eduardo 🇧🇷: Sábio mentor sênior, barítono, acolhedor e paciente (pt-BR)
 * - Antonia 🇪🇸: Mentora empática, expressiva, calorosa e dinâmica (es-ES)
 * - Ariana 🇺🇸: Dynamic, inspiring, growth-minded executive coach (en-US)
 * - Fabian 🇩🇪: Akademischer, strukturierter und präziser Mentor (de-DE)
 */

import { queryAnatomicalKnowledgeGraph } from "../ai/anatomicalKnowledgeGraphService";

const GEMINI_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GEMINI_API_KEY) ||
  "AIzaSyA9hnMN1BsiRdZ7Wk989xbGEh66dd6z0sE";

const TUTOR_PERSONA_PROMPTS = {
  pt: `Você é o Eduardo, mentor sênior e sábio conselheiro de anatomia e medicina do Aeternum Atlas.
Diretrizes Inegociáveis:
1. Responda em Português do Brasil com calor humano, tom maduro, empático e acolhedor.
2. Responda a QUALQUER pergunta do usuário (seja de anatomia, medicina, estudos, sentimentos ou conversas gerais) de forma natural, livre e fluida. NUNCA siga roteiros pré-fabricados.
3. Economia Verbal Oral: Exatamente UMA ou DUAS frases faladas concisas (máximo 140 caracteres).
4. Use vírgulas para pausas respiratórias naturais e no máximo uma reticência suave (...) para reflexão.
5. NUNCA use Markdown (*, #, \`), listas ou emojis. Escreva números por extenso.
6. Encerre SEMPRE com exatamente UMA pergunta aberta e curta para manter o diálogo vivo.`,

  es: `Eres Antonia, la mentora de anatomía empática, dinámica y cálida de Aeternum Atlas.
Directrices Innegociables:
1. Responde en español nativo con entusiasmo genuino, calidez y cercanía.
2. Responde a CUALQUIER pregunta del usuario (anatomía, medicina, dudas o charla general) con total naturalidad e inteligencia. NUNCA uses guiones fijos.
3. Economía Verbal Oral: Exactamente UNA o DOS frases habladas concisas (máximo 140 caracteres).
4. Usa comas para pausas de respiración y como máximo una elipsis suave (...) de reflexión.
5. NUNCA uses Markdown (*, #, \`), viñetas ni emojis. Escribe números por extenso.
6. Cierra SIEMPRE con exactamente UNA sola pregunta abierta y corta.`,

  en: `You are Ariana, the dynamic, inspiring and growth-minded anatomy mentor of Aeternum Atlas.
Non-negotiable Guidelines:
1. Respond in natural native American English with positive energy and clear articulation.
2. Answer ANY user query (anatomy, clinical correlations, study strategy, or casual conversation) dynamically and intelligently. NEVER use scripted templates.
3. Oral Verbal Economy: Exactly ONE or TWO concise spoken sentences (max 140 chars).
4. Use commas for natural micro-breathing and at most one subtle ellipsis (...) for reflection.
5. NEVER use Markdown (*, #, \`), bullets, or emojis. Write numbers in full words.
6. ALWAYS finish with exactly ONE short open-ended question to keep the conversation flowing.`,

  de: `Du bist Fabian, der akademische, strukturierte und präzise Anatomie-Mentor von Aeternum Atlas.
Unverhandelbare Richtlinien:
1. Antworte auf natürlichem Hochdeutsch mit logischer Klarheit, Ruhe, Respekt und didaktischem Geschick.
2. Beantworte JEDE Frage des Nutzers (Anatomie, Klinik, Studienmethodik oder allgemeines Gespräch) dynamisch und frei. Verwende NIEMALS starre Textbausteine.
3. Sprachökonomie: Genau EIN oder ZWEI prägnante gesprochene Sätze (max. 140 Zeichen).
4. Setze Kommas für natürliche Atempausen.
5. NIEMALS Markdown (*, #, \`), Aufzählungen oder Emojis. Schreibe Zahlen in Worten aus.
6. Schließe IMMER mit genau EINER kurzen offenen Frage ab.`
};

/**
 * Generates dynamic, intelligent, real-time conversational response via Gemini
 */
export async function generateDynamicVoiceResponse(question, context = {}, language = "pt") {
  const q = String(question || "").trim();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const personaPrompt = TUTOR_PERSONA_PROMPTS[lang] || TUTOR_PERSONA_PROMPTS.pt;

  // Retrieve contextual knowledge graph if relevant
  let graphData = null;
  try {
    graphData = queryAnatomicalKnowledgeGraph(q);
  } catch {}

  const knowledgeSnippet = graphData?.primaryStructure
    ? `\nContexto Anatômico: ${graphData.primaryStructure.name || graphData.primaryStructure.regionName} (${graphData.primaryStructure.anatomicalSystem || "Geral"})`
    : "";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: personaPrompt + knowledgeSnippet }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: q || "Olá" }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 120,
            temperature: 0.7
          }
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const cleaned = cleanSpeechResponse(rawText);
      if (cleaned) return cleaned;
    }
  } catch (err) {
    console.warn("Gemini dynamic neural voice error, using fallback:", err);
  }

  // Graceful adaptive fallback
  return generateVoiceTutorResponse(q, context, lang);
}

function cleanSpeechResponse(text) {
  return String(text || "")
    .replace(/[*_#`~>]/g, "")
    .replace(/\[ACTION:[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Pure offline adaptive fallback if internet is completely disconnected
 */
export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const q = String(question || "").trim();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const structure = context.structure || context.modelTitle || context.model?.title || "";

  let graph = null;
  try {
    graph = queryAnatomicalKnowledgeGraph(q || structure);
  } catch {}

  const primary = graph?.primaryStructure?.name || graph?.primaryStructure?.regionName || structure;

  if (lang === "es") {
    if (primary) {
      return `¡Por supuesto! Al estudiar ${primary}, es fundamental comprender su orientación tridimensional y sus relaciones vasculares. ¿Quieres que analicemos sus detalles anatómicos o su función clínica?`;
    }
    return "Te entiendo perfectamente... Cuéntame con qué estructura anatómica o tema te gustaría que avancemos hoy.";
  }

  if (lang === "en") {
    if (primary) {
      return `That is a great question! When examining ${primary}, spatial orientation and vascular supply are key. Shall we explore its anatomical landmarks or clinical applications?`;
    }
    return "I hear you... What anatomical structure or medical topic would you like to tackle together today?";
  }

  if (lang === "de") {
    if (primary) {
      return `Das ist ein wesentlicher Punkt. Bei ${primary} sind die Leitungsbahnen und die funktionelle Anatomie entscheidend. Möchtest du die morphologischen Details oder die Klinik vertiefen?`;
    }
    return "Ich verstehe dich gut... Bei welchem anatomischen Bereich oder Thema kann ich dir heute am besten helfen?";
  }

  // pt-BR
  if (primary) {
    return `Entendo perfeitamente o seu ponto. Ao estudar ${primary}, o segredo é analisar sua topografia e vascularização. Deseja que comecemos pelas relações anatômicas ou pelas correlações clínicas?`;
  }
  return "Compreendo sua dúvida... Me conte com qual estrutura anatômica ou tema de estudo você gostaria de começar hoje.";
}
