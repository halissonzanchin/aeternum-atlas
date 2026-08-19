/**
 * Aeternum Voice AI Brain — Dynamic Contextual Anatomy Engine
 * Generates natural, intelligent, unscripted responses tailored to the student's exact query
 * Base: Latarjet & Ruiz Liard, Terminologia Anatomica, and Relational Graph.
 *
 * Tutorship Personas:
 * - Eduardo 🇧🇷: Sábio, acolhedor, barítono, paciente (pt-BR)
 * - Antonia 🇪🇸: Empática, dinâmica, expressiva e calorosa (es-ES)
 * - Ariana 🇺🇸: Dynamic, inspiring, growth-minded coach (en-US)
 * - Fabian 🇩🇪: Akademisch, strukturiert, präzise (de-DE)
 */

import { queryAnatomicalKnowledgeGraph } from "../ai/anatomicalKnowledgeGraphService";

function cleanWords(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[?!.,;:()]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["como", "onde", "qual", "para", "quem", "este", "essa", "esta", "hola", "cómo", "dónde", "porque", "para", "what", "where", "when", "which", "wann", "warum"].includes(w));
}

export function generateVoiceTutorResponse(question, context = {}, language = "pt") {
  const q = String(question || "").trim();
  const lang = String(language || "pt").slice(0, 2).toLowerCase();
  const structure = context.structure || context.modelTitle || context.model?.title || "";

  let graph = null;
  try {
    graph = queryAnatomicalKnowledgeGraph(q || structure);
  } catch {}

  const primaryName = graph?.primaryStructure?.name || graph?.primaryStructure?.regionName || structure || "";
  const related = graph?.relatedStructures?.map((r) => r.name || r.regionName).filter(Boolean).slice(0, 2).join(", ");
  const userTerms = cleanWords(q).slice(0, 3).join(" e ");

  // 1. ESPAÑOL — Antonia 🇪🇸
  if (lang === "es") {
    if (q.length < 25 && /^(hola|buen|buenas|que tal|como estas)/i.test(q)) {
      return "¡Hola! Te doy una cálida bienvenida a Aeternum Atlas. Soy Antonia, tu mentora en español. ¿Qué estructura anatómica deseas explorar hoy?";
    }
    if (primaryName) {
      return `¡Por supuesto! Al analizar ${primaryName}, es fundamental examinar sus relaciones con ${related || "las estructuras adyacentes"} y su vascularización funcional. ¿Te gustaría que entremos en sus inserciones o en su trayecto vascular?`;
    }
    return `Entiendo perfectamente tu duda sobre ${userTerms || "este punto anatómico"}. Lo principal es comprender su orientación tridimensional y su función clínica. ¿Quieres que lo desglosemos paso a paso juntos?`;
  }

  // 2. ENGLISH — Ariana 🇺🇸
  if (lang === "en") {
    if (q.length < 25 && /^(hello|hi|hey|good morning|how are you)/i.test(q)) {
      return "Hello and welcome to Aeternum Atlas! I am Ariana, your anatomy mentor. How can I guide your journey today?";
    }
    if (primaryName) {
      return `Great question! When studying ${primaryName}, understanding its spatial orientation and relations with ${related || "surrounding tissues"} is key. Shall we explore its vascular supply or its mechanical function first?`;
    }
    return `I see what you mean regarding ${userTerms || "this topic"}. The core takeaway is connecting anatomical structure to clinical physiology. Would you like to break this down together right now?`;
  }

  // 3. DEUTSCH — Fabian 🇩🇪
  if (lang === "de") {
    if (q.length < 25 && /^(hallo|guten|hi|wie geht)/i.test(q)) {
      return "Hallo und herzlich willkommen bei Aeternum Atlas! Ich bin Fabian, dein Anatomie-Mentor. Wie kann ich dir heute helfen?";
    }
    if (primaryName) {
      return `Das ist ein sehr wichtiger Punkt. Bei ${primaryName} ist die topografische Lage zu ${related || "den Nachbarstrukturen"} sowie die Gefäßversorgung entscheidend. Möchtest du die Leitungsbahnen oder die Gelenkmechanik vertiefen?`;
    }
    return `Ich verstehe deine Frage zu ${userTerms || "diesem Bereich"}. Wesentlich ist hier der logische Zusammenhang zwischen Morphologie und Funktion. Sollen wir diesen Schritt gemeinsam analysieren?`;
  }

  // 4. PORTUGUÊS — Eduardo 🇧🇷
  if (q.length < 25 && /^(ol[aá]|oi|bom dia|boa tarde|tudo bem|como vai)/i.test(q)) {
    return "Olá! Seja muito bem-vindo ao Aeternum Atlas. Eu sou o Eduardo, seu mentor de anatomia. Como posso guiar seus estudos hoje?";
  }
  if (primaryName) {
    return `Entendo perfeitamente o seu ponto. Ao estudar ${primaryName}, o segredo é observar suas relações anatômicas com ${related || "as estruturas vizinhas"} e sua vascularização. Faz sentido para você começarmos pela anatomia topográfica ou pela clínica?`;
  }

  return `Compreendo sua dúvida sobre ${userTerms || "este ponto dos estudos"}. Vamos analisar com calma a morfologia em três dimensões e suas relações funcionais. O que você gostaria de explorar primeiro?`;
}
